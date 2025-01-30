require('dotenv').config({ path: '../.env' })

import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import http from 'http'
import { Db, MongoClient } from 'mongodb'
import { Server } from 'socket.io'
import TonWeb from 'tonweb'
import { Address } from 'tonweb/dist/types/utils/address'
import nacl from 'tweetnacl'
import { GameRoom } from './interfaces/card.interface'
import { initializeSockets } from './socket/socket.controller'
import userController from './user/user.controller'
import { shuffleDeck } from './utils'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 80

const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
})

const gameRooms: GameRoom = {} as GameRoom

const initializeRoom = (roomId: string) => {
	if (!gameRooms[roomId]) {
		gameRooms[roomId] = {
			players: [],
			deck: shuffleDeck(),
			tableCards: [],
			stage: 'initial',
			bank: 0,
		}
	}
}

initializeSockets(io)

app.use(
	cors({
		origin: '*',
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type'],
	})
)
app.use(bodyParser.json())
app.use(express.json())

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017'
const dbName = 'simple_poker'

export let db: Db

async function connectMongoDB() {
	try {
		const client = await MongoClient.connect(uri)
		console.log('Connected to MongoDB')
		db = client.db(dbName)
	} catch (err) {
		if (err instanceof Error) {
			console.error('Error connecting to MongoDB:', err.message)
		} else {
			console.error('Error connecting to MongoDB:', err)
		}
		process.exit(1)
	}
}

connectMongoDB()

const tonweb = new TonWeb(
	new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {
		apiKey: process.env.TONCENTER_API_KEY,
	})
)

export const walletManager = (() => {
	try {
		if (!process.env.TON_SEED) {
			console.error('TON_SEED environment variable is not set')
			return {
				getWalletAddress: () => null,
				getKeyPair: () => null,
				getWallet: () => null,
			}
		}

		const seed = TonWeb.utils.hexToBytes(process.env.TON_SEED)
		const keyPair = nacl.sign.keyPair.fromSeed(seed)
		const WalletClass = tonweb.wallet.all.v3R2
		const wallet = new WalletClass(tonweb.provider, {
			publicKey: keyPair.publicKey,
		})

		let walletAddress: Address
		;(async () => {
			try {
				walletAddress = await wallet.getAddress()
				console.log('Wallet Address:', walletAddress.toString(true, true, true))
			} catch (error) {
				console.error('Error retrieving wallet address:', error)
			}
		})()

		return {
			getWalletAddress: () => walletAddress,
			getKeyPair: () => keyPair,
			getWallet: () => wallet,
		}
	} catch (error) {
		console.error('Error initializing wallet manager:', error)
		return {
			getWalletAddress: () => null,
			getKeyPair: () => null,
			getWallet: () => null,
		}
	}
})()

const USD_TO_GAME_VALUE = 100

app.get('/', (req, res) => {
	res.send('Backend server is running!')
})

app.use('/api', userController)

async function checkForDeposits() {
	const walletAddress = walletManager
		.getWalletAddress()
		?.toString(true, true, true)
	if (!walletAddress) return console.error('No wallet address available.')

	try {
		const transactions = await tonweb.provider.getTransactions(
			walletAddress,
			10
		)
		for (const tx of transactions) {
			if (tx.in_msg && tx.in_msg.value > 0) {
				const valueTon = TonWeb.utils.fromNano(tx.in_msg.value)
				const userId = tx.in_msg.comment

				const usersCollection = db.collection('users')
				const user = await usersCollection.findOne({ id: parseInt(userId) })
				if (
					user &&
					!user.processedTransactions.includes(tx.transaction_id.hash)
				) {
					const inGameValue = Number(valueTon) * USD_TO_GAME_VALUE
					await usersCollection.updateOne(
						{ id: parseInt(userId) },
						{
							$inc: { balance: inGameValue },
							$push: { processedTransactions: tx.transaction_id.hash },
						}
					)
					console.log(`Deposit of ${valueTon} TON for user ${userId}.`)
				}
			}
		}
	} catch (error) {
		console.error('Error checking for deposits:', error)
	}
}

server.listen(port, () => {
	console.log(`Server running on port ${port}`)
})
