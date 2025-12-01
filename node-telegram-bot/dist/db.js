import { MongoClient, ObjectId } from 'mongodb';
const uri = 'mongodb://localhost:27017';
const dbName = 'simple_poker';
async function connectMongo() {
    try {
        const client = await MongoClient.connect(uri);
        console.log('Connected to MongoDB');
        const db = client.db(dbName);
        const usersCollection = db.collection('users');
        const newUser = {
            _id: new ObjectId(),
            firstName: 'Test',
            username: 'testuser',
            balance: 500,
            processedTransactions: [],
        };
        await usersCollection.insertOne(newUser);
        console.log('New user inserted:', newUser);
        client.close();
    }
    catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}
connectMongo();
