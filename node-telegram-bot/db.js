const { MongoClient } = require('mongodb');

// MongoDB connection URI
const uri = 'mongodb://localhost:27017';

// MongoDB Database Name
const dbName = 'simple_poker';

async function connectMongo() {
  try {
    const client = await MongoClient.connect(uri);
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    
    // Insert a new user
    const usersCollection = db.collection('users');
    const newUser = {
      _id: "test_user",
      firstName: "Test",
      username: "testuser",
      balance: 500,
      processedTransactions: []
    };
    
    await usersCollection.insertOne(newUser);
    console.log('New user inserted:', newUser);
    
    client.close();  // Close the connection
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  }
}

connectMongo();
