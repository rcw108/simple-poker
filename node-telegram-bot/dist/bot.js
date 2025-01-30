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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const tonweb_1 = __importDefault(require("tonweb"));
require('dotenv').config({ path: path_1.default.resolve(__dirname, '../.env') });
const bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_BOT_TOKEN || '', {
    polling: true,
});
const tonweb = new tonweb_1.default(new tonweb_1.default.HttpProvider('https://toncenter.com/api/v2/jsonRPC', {
    apiKey: process.env.TONCENTER_API_KEY,
}));
const walletAddress = process.env.WALLET_ADDRESS;
const presetAmounts = [1, 2, 5, 10];
const gameUrl = process.env.GAME_URL || 'https://simple-poker-kappa.vercel.app/';
let db;
let client;
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            client = yield mongodb_1.MongoClient.connect(process.env.MONGODB_URI || '');
            db = client.db(process.env.DB_NAME || '');
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    });
}
function updateUserBalance(userId, amountNano, txId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db)
            throw new Error('Database not connected');
        const amountAsNumber = Number(tonweb_1.default.utils.fromNano(amountNano));
        yield db.collection('users').updateOne({ id: userId }, {
            $inc: { balance: amountAsNumber },
            $push: {
                processedTransactions: {
                    id: txId,
                    amount: amountAsNumber,
                    timestamp: new Date(),
                },
            },
        }, { upsert: true });
    });
}
function getUserBalance(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db) {
            console.error('Database not connected');
            throw new Error('Database not connected');
        }
        try {
            const user = yield db.collection('users').findOne({ id: parseInt(userId) });
            if (!user) {
                console.error(`User with ID ${userId} not found`);
                return 0;
            }
            console.log(`Balance for user ${userId}: ${user.balance}`);
            return user.balance;
        }
        catch (error) {
            console.error(`Error fetching balance for user ${userId}:`, error);
            throw new Error('Error fetching user balance');
        }
    });
}
bot.onText(/\/game/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    try {
        const balance = yield getUserBalance(String(chatId));
        const keyboard = {
            inline_keyboard: [
                [{ text: 'Play Game', web_app: { url: gameUrl } }],
                [{ text: 'Add Funds', callback_data: 'add_funds' }],
            ],
        };
        bot.sendMessage(chatId, `Your current balance is: ${balance} in-game units\nReady to play?`, { reply_markup: keyboard });
    }
    catch (error) {
        console.error('Error fetching balance for /game command:', error);
        bot.sendMessage(chatId, 'An error occurred while fetching your balance. Please try again later.');
    }
}));
bot.on('callback_query', (callbackQuery) => __awaiter(void 0, void 0, void 0, function* () {
    if (!callbackQuery.message) {
        console.error('Callback query message is undefined');
        return;
    }
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    if (data === 'add_funds') {
        const keyboard = {
            inline_keyboard: presetAmounts.map(amount => [
                { text: `${amount} TON`, callback_data: `add_${amount}` },
            ]),
        };
        bot.sendMessage(chatId, 'Select the amount you want to add:', {
            reply_markup: keyboard,
        });
    }
    else if (data && data.startsWith('add_')) {
        const amount = parseFloat(data.split('_')[1]);
        yield generatePaymentLink(String(chatId), amount);
    }
    bot.answerCallbackQuery(callbackQuery.id);
}));
function generatePaymentLink(chatId, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const commentId = `${chatId}_${Date.now()}`;
        const amountNano = tonweb_1.default.utils.toNano(amount.toString());
        const paymentUrl = `https://app.tonkeeper.com/transfer/${walletAddress}?amount=${amountNano}&text=${commentId}`;
        const qrCode = yield qrcode_1.default.toDataURL(paymentUrl);
        bot.sendPhoto(chatId, Buffer.from(qrCode.split(',')[1], 'base64'), {
            caption: `Please send ${amount} TON to this address. You can use the QR code or this link: ${paymentUrl}`,
        });
        checkForPayment(chatId, commentId, amountNano);
    });
}
function checkForPayment(chatId, commentId, amountNano) {
    return __awaiter(this, void 0, void 0, function* () {
        let attempts = 0;
        const maxAttempts = 60;
        const checkInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(checkInterval);
                bot.sendMessage(chatId, 'Payment time expired. Please try again if you still want to add funds.');
                return;
            }
            try {
                const transactions = yield tonweb.provider.getTransactions(walletAddress || '');
                const matchingTx = transactions.find((tx) => tx.in_msg &&
                    tx.in_msg.message === commentId &&
                    tx.in_msg.value &&
                    tx.in_msg.value >= amountNano);
                if (matchingTx) {
                    clearInterval(checkInterval);
                    yield updateUserBalance(chatId, amountNano, matchingTx.transaction_id.hash);
                    const newBalanceNano = yield getUserBalance(chatId);
                    const newBalanceTon = tonweb_1.default.utils.fromNano(newBalanceNano);
                    bot.sendMessage(chatId, `Payment of ${tonweb_1.default.utils.fromNano(amountNano)} TON received successfully! Your new balance is ${newBalanceTon} TON.`);
                }
            }
            catch (error) {
                console.error('Error checking for payment:', error);
            }
        }), 10000);
    });
}
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Bot is shutting down...');
    if (client) {
        yield client.close();
        console.log('Closed MongoDB connection');
    }
    process.exit(0);
}));
connectToDatabase()
    .then(() => {
    bot.on('polling_error', error => console.log(error));
    console.log('Bot is running...');
})
    .catch(error => {
    console.error('Failed to start the bot:', error);
});
