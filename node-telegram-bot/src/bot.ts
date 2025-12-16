import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Db, MongoClient } from 'mongodb'
import TelegramBot from 'node-telegram-bot-api'
import QRCode from 'qrcode'
import TonWeb from 'tonweb'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', {
	polling: true,
})

const tonweb = new TonWeb(
	new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
		apiKey: process.env.TONCENTER_API_KEY,
	})
)
const walletAddress = process.env.WALLET_ADDRESS
const presetAmounts = [1, 2, 5, 10]
const gameUrl = 'https://simple-poker-kappa.vercel.app/'

// Helper function to create a game button (Web App for HTTPS, URL for HTTP)
function createGameButton(text: string, url: string) {
	// Remove trailing slash if present
	const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
	
	if (cleanUrl.startsWith('https://')) {
		return { text, web_app: { url: cleanUrl } }
	} else if (cleanUrl.startsWith('http://')) {
		// HTTP URLs cannot be used for Web App buttons in Telegram
		// Log warning and return URL button instead
		console.warn(`Warning: HTTP URL detected (${cleanUrl}). Telegram requires HTTPS for Web App buttons. Using regular URL button instead.`)
		console.warn('For local development, use ngrok to create an HTTPS tunnel:')
		console.warn('  1. Install ngrok: https://ngrok.com/download')
		console.warn('  2. Run: ngrok http 3000')
		console.warn('  3. Update GAME_URL in .env to the ngrok HTTPS URL')
		return { text, url: cleanUrl }
	} else {
		console.error(`Invalid URL format: ${url}. Expected http:// or https://`)
		return { text, url: cleanUrl }
	}
}

let db: Db
let client: MongoClient


async function connectToDatabase() {
	try {
		client = await MongoClient.connect(process.env.MONGODB_URI || '')
		db = client.db(process.env.DB_NAME || '')
		console.log('Connected to MongoDB')
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		console.error('Failed to connect to MongoDB:', errorMessage)
		process.exit(1)
	}
}

async function updateUserBalance(
	userId: string,
	amountNano: number,
	txId: string
) {
	if (!db) throw new Error('Database not connected')

	const userIdNum = parseInt(userId)
	const amountAsNumber = Number(TonWeb.utils.fromNano(amountNano))

	await db.collection('users').updateOne(
		{ id: userIdNum },
		{
			$inc: { balance: amountAsNumber },
			$push: { processedTransactions: txId } as any,
		},
		{ upsert: true }
	)
}

async function getUserBalance(userId: string, from?: TelegramBot.User) {
	if (!db) {
		console.error('Database not connected')
		throw new Error('Database not connected')
	}
	try {
		const userIdNum = parseInt(userId)
		let user = await db.collection('users').findOne({ id: userIdNum })
		
		if (!user) {
			// Auto-register user if not found
			console.log(`Registering new user with ID ${userId}`)
			const newUser = {
				id: userIdNum,
				firstName: from?.first_name || '',
				username: from?.username || '',
				balance: 0,
				bonusBalance: 100,
				processedTransactions: [] as string[],
				createdAt: new Date(),
			}
			await db.collection('users').insertOne(newUser)
			user = await db.collection('users').findOne({ id: userIdNum })
			if (!user) {
				throw new Error(`Failed to create user ${userId}`)
			}
			console.log(`[NEW USER] Created user: ${userId} (${from?.first_name || ''}${from?.username ? ` @${from.username}` : ''})`)
		}
		
		console.log(`Balance for user ${userId}: ${user.balance}`)
		return user.balance || 0
	} catch (error) {
		console.error(`Error fetching balance for user ${userId}:`, error)
		throw new Error('Error fetching user balance')
	}
}

bot.onText(/\/start/, async msg => {
	const chatId = msg.chat.id
	try {
		const balance = await getUserBalance(String(chatId), msg.from)
		const welcomeMessage = `🎮 Welcome to Simple Poker Bot!\n\n` +
			`Your current balance: ${balance} in-game units\n\n` +
			`Available commands:\n` +
			`/game - Start playing poker\n` +
			`/balance - Check your balance\n` +
			`/help - Show this help message`

		const keyboard = {
			inline_keyboard: [
				[createGameButton('🎮 Play Game', gameUrl)],
				[{ text: '💰 Add Funds', callback_data: 'add_funds' }],
			],
		}

		bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard })
	} catch (error) {
		console.error('Error in /start command:', error)
		bot.sendMessage(
			chatId,
			'Welcome to Simple Poker Bot! Use /game to start playing or /help for more information.'
		)
	}
})

bot.onText(/\/balance/, async msg => {
	const chatId = msg.chat.id
	try {
		const balance = await getUserBalance(String(chatId), msg.from)
		bot.sendMessage(chatId, `Your current balance is: ${balance} in-game units`)
	} catch (error) {
		console.error('Error fetching balance for /balance command:', error)
		bot.sendMessage(
			chatId,
			'An error occurred while fetching your balance. Please try again later.'
		)
	}
})

bot.onText(/\/help/, async msg => {
	const chatId = msg.chat.id
	const helpMessage = `📖 Simple Poker Bot Help\n\n` +
		`Commands:\n` +
		`/start - Start the bot and see your balance\n` +
		`/game - Open the game interface\n` +
		`/balance - Check your current balance\n` +
		`/help - Show this help message\n\n` +
		`To add funds, use the "Add Funds" button in the game menu.`

	bot.sendMessage(chatId, helpMessage)
})

bot.onText(/\/game/, async msg => {
	const chatId = msg.chat.id
	try {
		const balance = await getUserBalance(String(chatId), msg.from)

		const keyboard = {
			inline_keyboard: [
				[createGameButton('Play Game', gameUrl)],
				[{ text: 'Add Funds', callback_data: 'add_funds' }],
			],
		}

		bot.sendMessage(
			chatId,
			`Your current balance is: ${balance} in-game units\nReady to play?`,
			{ reply_markup: keyboard }
		)
	} catch (error) {
		console.error('Error fetching balance for /game command:', error)
		bot.sendMessage(
			chatId,
			'An error occurred while fetching your balance. Please try again later.'
		)
	}
})
bot.on('callback_query', async callbackQuery => {
	if (!callbackQuery.message) {
		console.error('Callback query message is undefined')
		return
	}
	const chatId = callbackQuery.message.chat.id
	const data = callbackQuery.data

	if (data === 'add_funds') {
		const keyboard = {
			inline_keyboard: presetAmounts.map(amount => [
				{ text: `${amount} TON`, callback_data: `add_${amount}` },
			]),
		}
		bot.sendMessage(chatId, 'Select the amount you want to add:', {
			reply_markup: keyboard,
		})
	} else if (data && data.startsWith('add_')) {
		const amount = parseFloat(data.split('_')[1])
		await generatePaymentLink(String(chatId), amount)
	}

	bot.answerCallbackQuery(callbackQuery.id)
})

async function generatePaymentLink(chatId: string, amount: number) {
	const commentId = `${chatId}_${Date.now()}`
	const amountNano = TonWeb.utils.toNano(amount.toString())
	const paymentUrl = `https://app.tonkeeper.com/transfer/${walletAddress}?amount=${amountNano}&text=${commentId}`

	const qrCode = await QRCode.toDataURL(paymentUrl)

	bot.sendPhoto(chatId, Buffer.from(qrCode.split(',')[1], 'base64'), {
		caption: `Please send ${amount} TON to this address. You can use the QR code or this link: ${paymentUrl}`,
	})

	checkForPayment(chatId, commentId, amountNano)
}

async function checkForPayment(
	chatId: string,
	commentId: string,
	amountNano: number
) {
	let attempts = 0
	const maxAttempts = 60

	const checkInterval = setInterval(async () => {
		attempts++
		if (attempts > maxAttempts) {
			clearInterval(checkInterval)
			bot.sendMessage(
				chatId,
				'Payment time expired. Please try again if you still want to add funds.'
			)
			return
		}

		try {
			const transactions = await tonweb.provider.getTransactions(
				walletAddress || ''
			)
			const matchingTx = transactions.find(
				(tx: {
					in_msg?: { message?: string; value?: number; body?: string }
				}) =>
					tx.in_msg &&
					tx.in_msg.message === commentId &&
					tx.in_msg.value &&
					tx.in_msg.value >= amountNano
			)

			if (matchingTx) {
				clearInterval(checkInterval)
				await updateUserBalance(
					chatId,
					amountNano,
					matchingTx.transaction_id.hash
				)
				const newBalanceNano = await getUserBalance(chatId)
				const newBalanceTon = TonWeb.utils.fromNano(newBalanceNano)

				bot.sendMessage(
					chatId,
					`Payment of ${TonWeb.utils.fromNano(
						amountNano
					)} TON received successfully! Your new balance is ${newBalanceTon} TON.`
				)
			}
		} catch (error) {
			console.error('Error checking for payment:', error)
		}
	}, 10000)
}

process.on('SIGINT', async () => {
	console.log('Bot is shutting down...')
	if (client) {
		await client.close()
		console.log('Closed MongoDB connection')
	}
	process.exit(0)
})

connectToDatabase()
	.then(() => {
		bot.on('polling_error', error => console.log(error))
		console.log('Bot is running...')
	})
	.catch(error => {
		console.error('Failed to start the bot:', error)
	})
