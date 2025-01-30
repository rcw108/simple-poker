"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { MongoClient } = require('mongodb');
// MongoDB connection URI
const uri = 'mongodb://localhost:27017';
// MongoDB Database Name
const dbName = 'simple_poker';
function connectMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const client = yield MongoClient.connect(uri);
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
            yield usersCollection.insertOne(newUser);
            console.log('New user inserted:', newUser);
            client.close(); // Close the connection
        }
        catch (err) {
            console.error('Error connecting to MongoDB:', err.message);
        }
    });
}
connectMongo();
