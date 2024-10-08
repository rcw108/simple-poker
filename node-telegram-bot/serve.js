// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const TonWeb = require('tonweb'); // Import TonWeb

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory user data store
const users = {};

// Initialize TonWeb with HTTP provider (using Toncenter's API)
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

// Generate a new wallet for testing purposes
// In production, you should generate a wallet separately and store the keys securely
const seed = TonWeb.utils.newSeed();
const keyPair = TonWeb.utils.keyPairFromSeed(seed);

// Create the wallet instance
const WalletClass = tonweb.wallet.all.v3R2;
const wallet = new WalletClass(tonweb.provider, {
  publicKey: keyPair.publicKey,
});

// Get the wallet address
let walletAddress;
(async () => {
  walletAddress = await wallet.getAddress();
  console.log('Wallet Address:', walletAddress.toString(true, true, true));
  console.log('Public Key:', TonWeb.utils.bytesToHex(keyPair.publicKey));
  console.log('Secret Key:', TonWeb.utils.bytesToHex(keyPair.secretKey));
  console.log('Seed (keep this secret):', TonWeb.utils.bytesToHex(seed));
})();

// Function to verify Telegram authentication data
function verifyTelegramAuth(initData) {
  const secretKey = crypto
    .createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const parsedData = new URLSearchParams(initData);
  const dataCheckString = [];
  const tgHash = parsedData.get('hash');

  parsedData.forEach((value, key) => {
    if (key !== 'hash') {
      dataCheckString.push(`${key}=${value}`);
    }
  });

  dataCheckString.sort();
  const dataString = dataCheckString.join('\n');

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataString)
    .digest('hex');

  return hmac === tgHash;
}

// Routes
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Endpoint to verify Telegram user
app.post('/api/verifyUser', (req, res) => {
  const { initData } = req.body;

  if (!verifyTelegramAuth(initData)) {
    return res.status(403).json({ success: false, message: 'Invalid Telegram authentication data.' });
  }

  const parsedData = new URLSearchParams(initData);
  const userId = parsedData.get('id');
  const firstName = parsedData.get('first_name');
  const username = parsedData.get('username');

  // Check if user exists, if not create a new user with default balance
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      firstName,
      username,
      balance: 500, // Default starting balance
      depositAddress: null, // We'll generate this later
      processedTransactions: [], // To keep track of processed deposits
    };
  }

  res.json({ success: true, user: users[userId] });
});

// Endpoint to get user balance
app.get('/api/getBalance', (req, res) => {
  const userId = req.query.userId;

  const user = users[userId];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  res.json({ success: true, balance: user.balance });
});

// Endpoint to update user balance
app.post('/api/updateBalance', (req, res) => {
  const { userId, balance } = req.body;

  const user = users[userId];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  user.balance = balance;

  res.json({ success: true });
});

// Endpoint to get deposit address and comment
app.get('/api/getDepositAddress', async (req, res) => {
  const userId = req.query.userId;

  const user = users[userId];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Get the main wallet address
  const addressString = walletAddress.toString(true, true, true);

  // Provide instructions to the user
  res.json({
    success: true,
    address: addressString,
    comment: userId, // Instruct the user to include this comment
  });
});

// Endpoint to handle withdrawal requests
app.post('/api/withdraw', async (req, res) => {
  let { userId, amount, toAddress } = req.body;

  const user = users[userId];

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  amount = parseFloat(amount);

  if (user.balance < amount) {
    return res.status(400).json({ success: false, message: 'Insufficient balance.' });
  }

  try {
    // Get the next sequence number (seqno) for the wallet
    const seqno = await wallet.methods.seqno().call();

    // Prepare the transfer
    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: toAddress,
      amount: TonWeb.utils.toNano(amount), // Convert TON to nanotons
      seqno: seqno,
      payload: null,
      sendMode: 3,
    });

    // Send the transfer
    await transfer.send();

    // Update user's balance
    user.balance -= amount;

    // Log the withdrawal
    console.log(`Processed withdrawal of ${amount} TON to ${toAddress} for user ${userId}`);

    res.json({ success: true, message: 'Withdrawal processed.' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ success: false, message: 'Withdrawal failed.' });
  }
});

// Function to check for new deposits
async function checkForDeposits() {
  try {
    const addressString = walletAddress.toString(true, true, true);

    // Fetch recent transactions
    const response = await tonweb.provider.getTransactions(addressString, 10);

    for (const tx of response) {
      if (tx.in_msg && tx.in_msg.value > 0) {
        const valueNano = tx.in_msg.value; // Amount in nanotons
        const valueTon = TonWeb.utils.fromNano(valueNano); // Convert to TON
        let comment = null;

        // Check if there's a comment (transaction message)
        if (tx.in_msg.msg_data && tx.in_msg.msg_data['@type'] === 'msg.dataText') {
          comment = tx.in_msg.msg_data.text;
        }

        // If there's a comment and it matches a user ID
        if (comment && users[comment]) {
          const userId = comment;
          const user = users[userId];

          // Check if this transaction has already been processed
          if (!user.processedTransactions.includes(tx.transaction_id.hash)) {
            // Update user's balance
            user.balance += parseFloat(valueTon);

            // Mark transaction as processed
            user.processedTransactions.push(tx.transaction_id.hash);

            console.log(`User ${userId} deposited ${valueTon} TON`);
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
