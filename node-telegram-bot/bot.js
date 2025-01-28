const TelegramBot = require('node-telegram-bot-api');
const TonWeb = require('tonweb');
const QRCode = require('qrcode');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
    apiKey: process.env.TONCENTER_API_KEY
}));
const walletAddress = process.env.WALLET_ADDRESS;
const presetAmounts = [1, 2, 5, 10];
const gameUrl = process.env.GAME_URL || 'https://simple-poker-kappa.vercel.app/';

let db;
let client;

async function connectToDatabase() {
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI);
        db = client.db(process.env.DB_NAME);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}


async function updateUserBalance(userId, amountNano, txId) {
    if (!db) throw new Error('Database not connected');

    const amountAsNumber = Number(TonWeb.utils.fromNano(amountNano));

    await db.collection('users').updateOne(
        { id: userId },
        { 
            $inc: { balance: amountAsNumber },
            $push: { processedTransactions: { id: txId, amount: amountAsNumber, timestamp: new Date() } }
        },
        { upsert: true }
    );
}

async function getUserBalance(userId) {
    if (!db) {
        console.error('Database not connected');
        throw new Error('Database not connected');
    }
    try {
        const user = await db.collection('users').findOne({ id: parseInt(userId) });
        if (!user) {
            console.error(`User with ID ${userId} not found`);
            return 0;
        }
        console.log(`Balance for user ${userId}: ${user.balance}`);
        return user.balance;
    } catch (error) {
        console.error(`Error fetching balance for user ${userId}:`, error);
        throw new Error('Error fetching user balance');
    }
}


bot.onText(/\/game/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const balance = await getUserBalance(chatId);

        const keyboard = {
            inline_keyboard: [
                [{ text: 'Play Game', web_app: { url: gameUrl } }],
                [{ text: 'Add Funds', callback_data: 'add_funds' }]
            ]
        };

        bot.sendMessage(chatId, `Your current balance is: ${balance} in-game units\nReady to play?`, { reply_markup: keyboard });
    } catch (error) {
        console.error('Error fetching balance for /game command:', error.message);
        bot.sendMessage(chatId, 'An error occurred while fetching your balance. Please try again later.');
    }
});


bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data === 'add_funds') {
        const keyboard = { inline_keyboard: presetAmounts.map(amount => [{ text: `${amount} TON`, callback_data: `add_${amount}` }]) };
        bot.sendMessage(chatId, 'Select the amount you want to add:', { reply_markup: keyboard });
    } else if (data.startsWith('add_')) {
        const amount = parseFloat(data.split('_')[1]);
        await generatePaymentLink(chatId, amount);
    }

    bot.answerCallbackQuery(callbackQuery.id); 
});

async function generatePaymentLink(chatId, amount) {
    const commentId = `${chatId}_${Date.now()}`;
    const amountNano = TonWeb.utils.toNano(amount.toString());
    const paymentUrl = `https://app.tonkeeper.com/transfer/${walletAddress}?amount=${amountNano}&text=${commentId}`;

    const qrCode = await QRCode.toDataURL(paymentUrl);

    bot.sendPhoto(chatId, Buffer.from(qrCode.split(',')[1], 'base64'), {
        caption: `Please send ${amount} TON to this address. You can use the QR code or this link: ${paymentUrl}`
    });


    checkForPayment(chatId, commentId, amountNano);
}


async function checkForPayment(chatId, commentId, amountNano) {
    let attempts = 0;
    const maxAttempts = 60;

    const checkInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(checkInterval);
            bot.sendMessage(chatId, 'Payment time expired. Please try again if you still want to add funds.');
            return;
        }

        try {
            const transactions = await tonweb.provider.getTransactions(walletAddress);
            const matchingTx = transactions.find(tx => 
                tx.in_msg && 
                tx.in_msg.message === commentId && 
                tx.in_msg.value >= amountNano
            );

            if (matchingTx) {
                clearInterval(checkInterval);
                await updateUserBalance(chatId, amountNano, matchingTx.transaction_id.hash);
                const newBalanceNano = await getUserBalance(chatId);
                const newBalanceTon = TonWeb.utils.fromNano(newBalanceNano);
                
                bot.sendMessage(chatId, `Payment of ${TonWeb.utils.fromNano(amountNano)} TON received successfully! Your new balance is ${newBalanceTon} TON.`);
            }
        } catch (error) {
            console.error('Error checking for payment:', error);
        }
    }, 10000);
}




process.on('SIGINT', async () => {
    console.log('Bot is shutting down...');
    if (client) {
        await client.close();
        console.log('Closed MongoDB connection');
    }
    process.exit(0);
});

connectToDatabase().then(() => {
    bot.on('polling_error', (error) => console.log(error));
    console.log('Bot is running...');
    
}).catch(error => {
    console.error('Failed to start the bot:', error);
});