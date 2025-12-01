import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import http from 'http'
import { Db, MongoClient } from 'mongodb'
import { Server } from 'socket.io'
import TonWeb from 'tonweb'
import { Address } from 'tonweb/dist/types/utils/address'
import nacl from 'tweetnacl'
import { GameRoom } from './interfaces/card.interface.js'
import { initializeSockets } from './socket/socket.controller.js'
import userController from './user/user.controller.js'
import { shuffleDeck } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

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

const uri = process.env.MONGODB_URI || ''
const dbName = process.env.DB_NAME || ''

export let db: Db
let mongoClient: MongoClient | null = null

async function connectMongoDB(retries = 5, delay = 3000) {
	for (let i = 0; i < retries; i++) {
		try {
			const client = await MongoClient.connect(uri)
			console.log('Connected to MongoDB')
			mongoClient = client
			db = client.db(dbName)
			return
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error'
			console.error(
				`Error connecting to MongoDB (attempt ${i + 1}/${retries}):`,
				errorMessage
			)
			
			if (i < retries - 1) {
				console.log(`Retrying in ${delay / 1000} seconds...`)
				await new Promise(resolve => setTimeout(resolve, delay))
			} else {
				console.error(
					'Failed to connect to MongoDB after all retries. Server will continue but database operations will fail.'
				)
				console.error(
					'Please ensure MongoDB is running and accessible.'
				)
			}
		}
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
				// Wallet address initialized successfully (not logged for security)
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
