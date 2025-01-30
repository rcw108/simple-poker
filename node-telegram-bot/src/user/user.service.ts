import expressAsyncHandler from 'express-async-handler'
import { Collection, ObjectId } from 'mongodb'
import TonWeb from 'tonweb'
import { IUser } from '../interfaces/card.interface'
import { db, walletManager } from '../serve'

export const getDepositAddress = expressAsyncHandler(async (req, res) => {
	const userId = req.query.userId

	if (!userId) {
		console.error('User ID is missing in the request.')
		res.status(400).json({ success: false, message: 'User ID is required.' })
		return
	}

	try {
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ id: String(userId) })

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
	const userId = req.query.userId

	if (!userId) {
		console.error('User ID is missing in the request.')
		res.status(400).json({ success: false, message: 'User ID is required.' })
		return
	}

	try {
		const usersCollection = db.collection('users')
		const user = await usersCollection.findOne({ id: String(userId) })

		if (!user) {
			console.error(`User not found: ${userId}`)
			res.status(404).json({ success: false, message: 'User not found.' })
			return
		}

		res.json({ success: true, balance: user.balance })
	} catch (err) {
		console.error('Error retrieving balance:', err)
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

	try {
		const usersCollection = db.collection('users')
		const result = await usersCollection.updateOne(
			{ id: userId },
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
	console.log('Incoming verifyUser request:')
	console.log('Headers:', req.headers)
	console.log('Body:', req.body)
	const { initDataUnsafe } = req.body

	console.log('Received initDataUnsafe:', initDataUnsafe)

	if (!initDataUnsafe || !initDataUnsafe.user || !initDataUnsafe.user.id) {
		res
			.status(400)
			.json({ success: false, message: 'Invalid or missing user data.' })
		return
	}
	const userId = initDataUnsafe.user.id
	const firstName = initDataUnsafe.user.first_name
	const username = initDataUnsafe.user.username

	try {
		const usersCollection = db.collection('users')

		let user = await usersCollection.findOne({ id: userId })

		if (user) {
			console.log(`User ${userId} already exists in the database.`)
			res.json({ success: true, user })
			return
		}
		user = {
			_id: new ObjectId(),
			id: userId,
			firstName,
			username,
			balance: 0,
			bonusBalance: 100,
			processedTransactions: [],
		}

		await usersCollection.insertOne(user)
		console.log(`Created new user: ${userId}`)

		res.json({ success: true, user })
	} catch (err) {
		console.error('Error verifying user:', err)
		res.status(500).json({ success: false, message: 'Internal server error.' })
	}
})
