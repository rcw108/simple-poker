// server.js

require('dotenv').config({ path: '../.env' });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const uuid = require('uuid');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const TonWeb = require('tonweb');
const { MongoClient } = require('mongodb'); // MongoDB Client

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 80;


const {
  getFourOfAKind,
  getFullHouse,
  getFlush,
  getStraight,
  getThreeOfAKind,
  getTwoPair,
  getPair,
} = require('./combination.js');


const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const gameRooms = {};

// Utility functions
const shuffleDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  const deck = [];

  suits.forEach((suit) => {
      ranks.forEach((rank) => {
          deck.push({ suit, rank });
      });
  });

  for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};


const initializeRoom = (roomId) => {
  if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
          players: [],
          deck: shuffleDeck(),
          tableCards: [],
          stage: 'initial',
      };
  }
};


const evaluateHand = (cards) => {
  if (getFourOfAKind(cards).length) return { hand: 'Four of a Kind', rank: 8 };
  if (getFullHouse(cards).length) return { hand: 'Full House', rank: 7 };
  if (getFlush(cards).length) return { hand: 'Flush', rank: 6 };
  if (getStraight(cards).length) return { hand: 'Straight', rank: 5 };
  if (getThreeOfAKind(cards).length) return { hand: 'Three of a Kind', rank: 4 };
  if (getTwoPair(cards).length) return { hand: 'Two Pair', rank: 3 };
  if (getPair(cards).length) return { hand: 'One Pair', rank: 2 };
  return { hand: 'High Card', rank: 1 };
};

// Socket.io handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on('joinRoom', ({ roomId, userId }) => {
    // Check if room exists, if not, initialize it
    if (!gameRooms[roomId]) {
        gameRooms[roomId] = {
            players: [],
            deck: shuffleDeck(), // Initialize a new shuffled deck
            tableCards: [],
            stage: 'initial',
        };
        console.log(`Room ${roomId} created`);
    }

    const room = gameRooms[roomId];

    // Ensure the room does not exceed two players
    if (room.players.length >= 2) {
        socket.emit('error', 'Room is full.');
        return;
    }

    // Check if the user is already in the room
    if (!room.players.find((player) => player.id === userId)) {
        room.players.push({
            id: userId,
            cards: [],
            balance: 100, // Example starting balance
        });
        console.log(`User ${userId} added to room ${roomId}`);
    }

    socket.join(roomId);
    io.to(roomId).emit('roomUpdate', room); // Notify all clients in the room about the update
});

  // Handle placing bets
  socket.on('placeBet', ({ roomId, userId, betAmount }) => {
      const room = gameRooms[roomId];
      if (!room) {
          socket.emit('error', 'Room does not exist');
          return;
      }

      const player = room.players.find((p) => p.id === userId);
      if (!player || player.balance < betAmount) {
          socket.emit('error', 'Insufficient balance');
          return;
      }

      player.balance -= betAmount;
      room.bank += betAmount;

      io.to(roomId).emit('betUpdate', { player, bank: room.bank });
      console.log(`Player ${player.username} placed a bet of ${betAmount}`);
  });

  // Handle dealing cards
  socket.on('dealCards', ({ roomId }) => {
    const room = gameRooms[roomId];

    // Validate the room and player count
    if (!room) {
        socket.emit('error', 'Room does not exist');
        return;
    }

    if (room.players.length !== 2) {
        socket.emit('error', 'The game requires exactly two players to start.');
        return;
    }

    if (room.stage !== 'initial') {
        socket.emit('error', 'Cannot deal cards. The game is not in the initial stage.');
        return;
    }

    // Ensure the deck exists and is shuffled
    if (!room.deck || room.deck.length === 0) {
        room.deck = shuffleDeck(); // Implement a function to shuffle and initialize the deck
    }

    // Deal cards one by one to each player
    for (let i = 0; i < 2; i++) {
        room.players.forEach((player) => {
            player.cards.push(room.deck.shift());
        });
    }

    // Deal the table cards
    room.tableCards = room.deck.splice(0, 5);

    // Update the game stage
    room.stage = 'betting';

    // Broadcast the updated room state to all clients in the room
    io.to(roomId).emit('gameUpdate', room);

    console.log(`Cards dealt one by one to players in room ${roomId}`);
});

  // Handle revealing cards
  socket.on('revealCards', async ({ roomId }) => {
    const room = gameRooms[roomId];
    if (!room || room.stage !== 'betting') {
        socket.emit('error', 'Cannot reveal cards');
        return;
    }

    const results = room.players.map((player) => {
        const hand = evaluateHand([...player.cards, ...room.tableCards]);
        return { playerId: player.id, username: player.username, hand };
    });

    const winner = results.reduce((best, current) => {
        return current.hand.rank > best.hand.rank ? current : best;
    });

    room.stage = 'reveal';

    // Update balances
    const bank = room.players.reduce((acc, player) => acc + player.balance, 0);
    const playersCollection = db.collection('users');

    try {
        await playersCollection.updateOne(
            { id: winner.playerId },
            { $inc: { balance: bank } }
        );

        // Save the game result
        const gamesCollection = db.collection('games');
        await gamesCollection.insertOne({
            roomId,
            winnerId: winner.playerId,
            winnerHand: winner.hand,
            players: room.players.map(player => ({
                id: player.id,
                username: player.username,
                balance: player.balance,
                hand: results.find(res => res.playerId === player.id)?.hand,
            })),
            tableCards: room.tableCards,
            bank,
            timestamp: new Date(),
        });

        io.to(roomId).emit('gameResult', { winner, results, bank });
        console.log(`Game result saved and balances updated for room ${roomId}`);
    } catch (error) {
        console.error('Error saving game result or updating balances:', error);
        socket.emit('error', 'Internal server error.');
    }
});

  // Start a new round
  socket.on('startNewRound', ({ roomId }) => {
      const room = gameRooms[roomId];
      if (!room) {
          socket.emit('error', 'Room does not exist');
          return;
      }

      room.deck = shuffleDeck();
      room.tableCards = [];
      room.bank = 0;
      room.players.forEach((player) => {
          player.cards = [];
      });
      room.stage = 'initial';

      io.to(roomId).emit('gameUpdate', room);
      console.log(`New round started in room ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins (or restrict to specific origins)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
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

// Endpoint to get deposit address and comment (Admin wallet)
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', { apiKey: process.env.TONCENTER_API_KEY }));

const walletManager = (() => {
  const seed = TonWeb.utils.hexToBytes(process.env.TON_SEED);
  const keyPair = TonWeb.utils.keyPairFromSeed(seed);
  const WalletClass = tonweb.wallet.all.v3R2;
  const wallet = new WalletClass(tonweb.provider, { publicKey: keyPair.publicKey });

  let walletAddress;
  (async () => {
    try {
      walletAddress = await wallet.getAddress();
      console.log('Wallet Address:', walletAddress.toString(true, true, true));
    } catch (error) {
      console.error('Error retrieving wallet address:', error);
    }
  })();

  return {
    getWalletAddress: () => walletAddress,
    getKeyPair: () => keyPair,
    getWallet: () => wallet,
  };
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
  console.log('Incoming verifyUser request:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body); // Log the entire body
  const { initDataUnsafe } = req.body;

  // Add debugging logs
  console.log('Received initDataUnsafe:', initDataUnsafe);

  if (!initDataUnsafe || !initDataUnsafe.user || !initDataUnsafe.user.id) {
    return res.status(400).json({ success: false, message: 'Invalid or missing user data.' });
  }
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
      balance: 0,
      bonusBalance: 100,
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

app.get('/api/getBalance', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    console.error('User ID is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ id: parseInt(userId) });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Return the user's balance
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    console.error('Error retrieving balance:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Update user balance
app.post('/api/updateBalance', async (req, res) => {
  const { userId, balance } = req.body;

  if (!userId || balance === undefined) {
    console.error('User ID or balance is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID and balance are required.' });
  }

  try {
    const usersCollection = db.collection('users');
    const result = await usersCollection.updateOne(
      { id: userId },
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

// Route to generate deposit address for a user
app.get('/api/getDepositAddress', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    console.error('User ID is missing in the request.');
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    const usersCollection = db.collection('users'); // Fetch the users collection from MongoDB
    const user = await usersCollection.findOne({ id: parseInt(userId) });

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
  } catch (error) {
    console.error('Error retrieving deposit address:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Route to handle withdrawal requests
app.post('/api/withdraw', async (req, res) => {
  const { userId, amount, toAddress } = req.body;
  if (!userId || !amount || !toAddress) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ id: parseInt(userId) });

    if (!user || user.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance or user not found.' });
    }

    const wallet = walletManager.getWallet();
    const keyPair = walletManager.getKeyPair();
    const seqno = await wallet.methods.seqno().call();

    // Send TON to user wallet
    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: toAddress,
      amount: TonWeb.utils.toNano(amount.toString()), // Convert amount to NanoTON
      seqno,
      payload: null,
      sendMode: 3,
    });

    await transfer.send();

    // Deduct from user balance
    await usersCollection.updateOne({ id: parseInt(userId) }, { $inc: { balance: -amount } });
    return res.json({ success: true, message: 'Withdrawal processed successfully.' });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ success: false, message: 'Error processing withdrawal.' });
  }
});

// Monitor deposits (can be called periodically via cron or similar)
async function checkForDeposits() {
  const walletAddress = walletManager.getWalletAddress()?.toString(true, true, true);
  if (!walletAddress) return console.error('No wallet address available.');

  try {
    const transactions = await tonweb.provider.getTransactions(walletAddress, 10);
    for (const tx of transactions) {
      if (tx.in_msg && tx.in_msg.value > 0) {
        const valueTon = TonWeb.utils.fromNano(tx.in_msg.value);
        const userId = tx.in_msg.comment; // Assuming the comment is the userId

        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ id: parseInt(userId) });
        if (user && !user.processedTransactions.includes(tx.transaction_id.hash)) {
          const inGameValue = valueTon * USD_TO_GAME_VALUE; // Convert TON to in-game value
          await usersCollection.updateOne(
            { id: parseInt(userId) },
            { $inc: { balance: inGameValue }, $push: { processedTransactions: tx.transaction_id.hash } }
          );
          console.log(`Deposit of ${valueTon} TON for user ${userId}.`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking for deposits:', error);
  }
}

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});