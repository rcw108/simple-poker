import expressAsyncHandler from 'express-async-handler'
import { Collection, ObjectId } from 'mongodb'
import TonWeb from 'tonweb'
import { IUser } from '../interfaces/card.interface.js'
import { db, walletManager } from '../serve.js'

export const getDepositAddress = expressAsyncHandler(async (req, res) => {
	const userId = req.query.userId

	if (!userId) {
		console.error('User ID is missing in the request.')
		res.status(400).json({ success: false, message: 'User ID is required.' })
		return
	}

	if (!db) {
		console.error('Database not connected in getDepositAddress')
		res.status(500).json({ success: false, message: 'Database not available.' })
		return
	}

	try {
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ id: parseInt(String(userId)) })

		if (!user) {
			console.error(`User not found: ${userId}`)
			res.status(404).json({ success: false, message: 'User not found.' })
			return
		}

		const addressString = walletManager
			.getWalletAddress()
			?.toString(true, true, true)

		if (!addressString) {
			console.error('Failed to retrieve wallet address.')
			res
				.status(500)
				.json({ success: false, message: 'Failed to retrieve wallet address.' })
			return
		}

		res.json({
			success: true,
			address: addressString,
			comment: userId,
		})
	} catch (error) {
		console.error('Error retrieving deposit address:', error)
		res.status(500).json({ success: false, message: 'Internal server error.' })
	}
})

export const getBalance = expressAsyncHandler(async (req, res) => {
	console.log('[getBalance] Request received:', {
		query: req.query,
		userId: req.query.userId,
		url: req.url,
		path: req.path
	})
	
	const userId = req.query.userId

	if (!userId) {
		console.error('[getBalance] User ID is missing in the request. Query:', req.query)
		res.status(400).json({ success: false, message: 'User ID is required.' })
		return
	}

	if (!db) {
		console.error('Database not connected in getBalance')
		res.status(500).json({ success: false, message: 'Database not available.' })
		return
	}

	try {
		const usersCollection = db.collection('users')
		const userIdNum = parseInt(String(userId))
		const user = await usersCollection.findOne({ id: userIdNum })

		if (!user) {
			console.error(`[getBalance] User not found: ${userId}`)
			res.status(404).json({ success: false, message: 'User not found.' })
			return
		}

		// Ensure balance is a number, default to 0 if undefined or null
		let balance = typeof user.balance === 'number' ? user.balance : 0
		
		// If balance is missing, update the user record
		if (user.balance === undefined || user.balance === null) {
			console.log(`[getBalance] User ${userId} has no balance, setting to 0`)
			await usersCollection.updateOne(
				{ id: userIdNum },
				{ $set: { balance: 0 } }
			)
			balance = 0
		}
		
		console.log(`[getBalance] User ${userId}: balance = ${balance} (type: ${typeof balance})`)
		const response = { success: true, balance }
		console.log(`[getBalance] Sending response:`, response)
		res.json(response)
	} catch (err) {
		console.error('[getBalance] Error retrieving balance:', err)
		res.status(500).json({ success: false, message: 'Internal server error.' })
	}
})

export const withdraw = expressAsyncHandler(
	async (req, res, next): Promise<void> => {
		const { userId, amount, toAddress } = req.body
		if (!userId || !amount || !toAddress) {
			res
				.status(400)
				.json({ success: false, message: 'Missing required fields.' })
			return
		}

		if (!db) {
			console.error('Database not connected in withdraw')
			res.status(500).json({ success: false, message: 'Database not available.' })
			return
		}

		try {
			const usersCollection: Collection<IUser> = db.collection('users')
			const user = await usersCollection.findOne({ id: parseInt(userId) })

			if (!user || user.balance < amount) {
				res.status(400).json({
					success: false,
					message: 'Insufficient balance or user not found.',
				})
				return
			}

			const wallet = walletManager.getWallet()
			const keyPair = walletManager.getKeyPair()
			if (!wallet || !keyPair) {
				res.status(500).json({
					success: false,
					message: 'Failed to retrieve wallet or key pair.',
				})

				return
			}

			const seqno: number = (await wallet.methods.seqno().call()) || 0

			const transfer = wallet.methods.transfer({
				secretKey: keyPair.secretKey,
				toAddress: toAddress,
				amount: TonWeb.utils.toNano(amount.toString()),
				seqno,
				payload: undefined,
				sendMode: 3,
			})

			await transfer.send()

			await usersCollection.updateOne(
				{ id: parseInt(userId) },
				{ $inc: { balance: -amount } }
			)

			res.json({
				success: true,
				message: 'Withdrawal processed successfully.',
			})
			return
		} catch (error) {
			console.error('Error processing withdrawal:', error)
			res
				.status(500)
				.json({ success: false, message: 'Error processing withdrawal.' })
			return
		}
	}
)

export const updateBalance = expressAsyncHandler(async (req, res) => {
	const { userId, balance } = req.body

	if (!userId || balance === undefined) {
		console.error('User ID or balance is missing in the request.')
		res
			.status(400)
			.json({ success: false, message: 'User ID and balance are required.' })
		return
	}

	if (!db) {
		console.error('Database not connected in updateBalance')
		res.status(500).json({ success: false, message: 'Database not available.' })
		return
	}

	try {
		const usersCollection = db.collection('users')
		const result = await usersCollection.updateOne(
			{ id: parseInt(String(userId)) },
			{ $set: { balance } }
		)

		if (result.matchedCount === 0) {
			console.error(`User not found: ${userId}`)
			res.status(404).json({ success: false, message: 'User not found.' })
			return
		}

		console.log(`Updated balance for user ${userId}: ${balance}`)
		res.json({ success: true })
	} catch (err) {
		console.error('Error updating balance:', err)
		res.status(500).json({ success: false, message: 'Internal server error.' })
	}
})

export const verifyUser = expressAsyncHandler(async (req, res) => {
	const { initDataUnsafe } = req.body

	if (!initDataUnsafe || !initDataUnsafe.user || !initDataUnsafe.user.id) {
		console.error('Missing user data in request')
		res
			.status(400)
			.json({ success: false, message: 'Invalid or missing user data. Please ensure you are accessing this from a Telegram WebApp.' })
		return
	}
	
	// Ensure userId is a number (Telegram sends it as number, but ensure consistency)
	const userId = parseInt(String(initDataUnsafe.user.id))
	const firstName = initDataUnsafe.user.first_name
	const username = initDataUnsafe.user.username

	if (!db) {
		console.error('Database not connected in verifyUser')
		res.status(500).json({ success: false, message: 'Database not available. Please try again later.' })
		return
	}

	try {
		const usersCollection = db.collection('users')

		let user = await usersCollection.findOne({ id: userId })

		if (user) {
			// User already exists, ensure balance is set
			if (user.balance === undefined || user.balance === null) {
				await usersCollection.updateOne(
					{ id: userId },
					{ $set: { balance: 0 } }
				)
				user.balance = 0
			}
			// Return user data including balance
			res.json({ success: true, user })
			return
		}
		
		// Create new user with numeric ID
		user = {
			_id: new ObjectId(),
			id: userId,
			firstName,
			username,
			balance: 0,
			bonusBalance: 100,
			processedTransactions: [],
			createdAt: new Date(),
		}

		await usersCollection.insertOne(user)
		console.log(`[NEW USER] Created user: ${userId} (${firstName}${username ? ` @${username}` : ''}) with balance: ${user.balance}`)

		// Ensure balance is included in response
		res.json({ success: true, user: { ...user, balance: user.balance || 0 } })
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error'
		console.error('Error verifying user:', errorMessage, err)
		res.status(500).json({ success: false, message: `Internal server error: ${errorMessage}` })
	}
})
