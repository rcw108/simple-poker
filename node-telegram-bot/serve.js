// server.js

require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const TonWeb = require('tonweb');
const { MongoClient } = require('mongodb'); // MongoDB Client

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection URI (replace with your MongoDB URI)
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'simple_poker';

// MongoDB connection and initialization
let db;

async function connectMongoDB() {
  try {
    const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit if there is an error connecting to MongoDB
  }
}

// Call this function to initialize MongoDB connection
connectMongoDB();


const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', { apiKey: process.env.TONCENTER_API_KEY }));

const walletManager = (() => {
  try {
    const seed = TonWeb.utils.hexToBytes(process.env.TON_SEED);
    const keyPair = TonWeb.utils.keyPairFromSeed(seed);
    const WalletClass = tonweb.wallet.all.v3R2;
    const wallet = new WalletClass(tonweb.provider, {
      publicKey: keyPair.publicKey,
    });

    let walletAddress;
    (async () => {
      try {
        walletAddress = await wallet.getAddress();
        console.log('Wallet Address:', walletAddress.toString(true, true, true));

        // Check seqno without deployment logic
        let seqno = await wallet.methods.seqno().call();
        if (seqno !== null) {
          console.log('Wallet is already deployed.');
        }
      } catch (error) {
        console.error('Error interacting with wallet:', error);
      }
    })();

    const getWalletAddress = () => walletAddress;
    const getKeyPair = () => keyPair;
    const getWallet = () => wallet;

    return { getWalletAddress, getKeyPair, getWallet };
  } catch (error) {
    console.error('Error initializing wallet:', error);
    process.exit(1);
  }
})();

// Conversion rates
const USD_TO_GAME_VALUE = 100; // 1 USDT TON = 100 in-game value

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

function verifyTelegramAuth(initData, initDataUnsafe) {
  // Debugging logs to see if initDataUnsafe is passed correctly
  console.log('Init Data Unsafe in verifyTelegramAuth:', initDataUnsafe);

  if (!initDataUnsafe || !initDataUnsafe.auth_date) {
    console.error('Invalid initDataUnsafe, missing fields');
    return false;
  }

  // Generate the secret key
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  // Build the data check string
  const dataCheckString = [
    `auth_date=${initDataUnsafe.auth_date}`,
    `query_id=${initDataUnsafe.query_id}`,
    `user=${JSON.stringify(initDataUnsafe.user)}`
  ].join('\n');

  // Generate the HMAC of the data check string
  const generatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Compare the generated hash with the hash received from Telegram
  if (generatedHash === initDataUnsafe.hash) {
    return true; // Validation successful
  } else {
    console.error('Hash mismatch, invalid data');
    return false; // Validation failed
  }
}

app.post('/api/verifyUser', async (req, res) => {
  const { initDataUnsafe } = req.body;
  const userId = initDataUnsafe.user.id;
  const firstName = initDataUnsafe.user.first_name;
  const username = initDataUnsafe.user.username;

  try {
    const usersCollection = db.collection('users');

    // Check if the user already exists in the database
    let user = await usersCollection.findOne({ id: userId });

    if (user) {
      console.log(`User ${userId} already exists in the database.`);
      // You could update the user info here if needed
      return res.json({ success: true, user });
    }

    // If the user does not exist, create a new user
    user = {
      id: userId,
      firstName,
      username,
      balance: 100,
      processedTransactions: []
    };

    await usersCollection.insertOne(user);
    console.log(`Created new user: ${userId}`);

    res.json({ success: true, user });
  } catch (err) {
    console.error('Error verifying user:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Update user balance
app.post('/api/updateBalance', async (req, res) => {
  const { userId, balance } = req.body;

  if (!userId) {
    console.error('User ID is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    const usersCollection = db.collection('users');
    const result = await usersCollection.updateOne(
      { _id: userId },
      { $set: { balance } }
    );

    if (result.matchedCount === 0) {
      console.error(`User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log(`Updated balance for user ${userId}: ${balance}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating balance:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Endpoint to get deposit address and comment (Admin wallet)
app.get('/api/getDepositAddress', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    console.error('User ID is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  const user = users[userId];

  if (!user) {
    console.error(`User not found: ${userId}`);
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const addressString = walletManager.getWalletAddress()?.toString(true, true, true);

  if (!addressString) {
    console.error('Failed to retrieve wallet address.');
    return res.status(500).json({ success: false, message: 'Failed to retrieve wallet address.' });
  }

  res.json({
    success: true,
    address: addressString,
    comment: userId, // User ID will be used as the comment for tracking deposits
  });
});

// Endpoint to handle withdrawal requests (From Admin wallet to User wallet)
app.post('/api/withdraw', async (req, res) => {
  let { userId, amount, toAddress } = req.body;

  if (!userId) {
    console.error('User ID is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  const user = users[userId];

  if (!user) {
    console.error(`User not found: ${userId}`);
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Convert in-game value to USDT TON
  const usdtAmount = amount / USD_TO_GAME_VALUE;

  if (user.balance < amount) {
    console.error(`Insufficient balance for user ${userId}. Requested: ${amount}, Available: ${user.balance}`);
    return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  }

  try {
    const wallet = walletManager.getWallet();
    const keyPair = walletManager.getKeyPair();
    let seqno = await getValidSeqno(wallet);

    console.log(`Attempting withdrawal of ${usdtAmount} USDT TON to address ${toAddress} with seqno ${seqno}`);

    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: toAddress,
      amount: TonWeb.utils.toNano(usdtAmount.toString()),
      seqno: seqno,
      payload: null,
      sendMode: 3,
    });

    await transfer.send();

    user.balance -= amount;

    console.log(`Processed withdrawal of ${usdtAmount} USDT TON to ${toAddress} for user ${userId}`);

    res.json({ success: true, message: 'Withdrawal processed.' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    res.status(500).json({ success: false, message: 'Withdrawal failed.', error: error.message });
  }
});

// Function to get a valid seqno with retry logic
async function getValidSeqno(wallet) {
  let retries = 5;  // Set the number of retries
  let seqno = null;

  while (retries > 0) {
    seqno = await wallet.methods.seqno().call();
    if (seqno !== null && seqno >= 0) {
      return seqno;
    }
    retries--;
    console.log(`Retrying to get seqno... Attempts left: ${retries}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
  }
  throw new Error('Invalid seqno retrieved. Please try again later.');
}

// Function to check for new deposits (Admin wallet)
async function checkForDeposits() {
  try {
    const addressString = walletManager.getWalletAddress()?.toString(true, true, true);
    if (!addressString) {
      console.error('Failed to retrieve wallet address for deposit check.');
      return;
    }

    console.log(`Checking for deposits to address: ${addressString}`);

    // Get the last 10 transactions
    const response = await tonweb.provider.getTransactions(addressString, 10);

    for (const tx of response) {
      if (tx.in_msg && tx.in_msg.value > 0) {
        const valueNano = tx.in_msg.value;
        const valueTon = TonWeb.utils.fromNano(valueNano);  // Convert to TON
        let comment = null;

        // Extract comment (user ID) from the transaction
        if (tx.in_msg.msg_data && tx.in_msg.msg_data['@type'] === 'msg.dataText') {
          comment = tx.in_msg.msg_data.text;
        }

        if (comment) {
          const userId = comment;

          // Check if the user exists
          const usersCollection = db.collection('users');
          const user = await usersCollection.findOne({ _id: userId });

          if (user && !user.processedTransactions.includes(tx.transaction_id.hash)) {
            const gameValue = valueTon * USD_TO_GAME_VALUE;  // Convert TON to in-game value

            // Update user's balance
            await usersCollection.updateOne(
              { _id: userId },
              { 
                $inc: { balance: gameValue },
                $push: { processedTransactions: tx.transaction_id.hash }
              }
            );

            console.log(`User ${userId} deposited ${valueTon} TON (${gameValue} in-game value)`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for deposits:', error);
  }
}
// Set an interval to check for deposits every minute
setInterval(checkForDeposits, 60000);

// Start the server
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});


// async function mockTransaction() {
//   const userId = 'test_user';  // Hardcoded for now
//   const mockTxId = `tx_${Math.random().toString(36).substr(2, 9)}`;  // Simulate a transaction ID
//   const valueTon = 1;  // Simulate receiving 1 TON

//   try {
//     // Fetch user from MongoDB
//     const usersCollection = db.collection('users');
//     const user = await usersCollection.findOne({ _id: userId });

//     if (!user) {
//       console.error(`User not found: ${userId}`);
//       return;
//     }

//     // Check if the transaction has been processed
//     if (!user.processedTransactions.includes(mockTxId)) {
//       const gameValue = valueTon * USD_TO_GAME_VALUE;  // Convert TON to in-game value

//       // Update user's balance and add transaction to processedTransactions
//       await usersCollection.updateOne(
//         { _id: userId },
//         { 
//           $inc: { balance: gameValue }, 
//           $push: { processedTransactions: mockTxId } 
//         }
//       );

//       console.log(`Mock transaction processed for user ${userId}: ${valueTon} TON (${gameValue} in-game value)`);
//     }
//   } catch (error) {
//     console.error('Error processing mock transaction:', error.message);
//   }
// }

// // Call mockTransaction to simulate a transaction every 30 seconds (just for testing)
// setInterval(mockTransaction, 30000);
