// Import required modules
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Load the Telegram bot token from .env
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Listen for '/game' command and respond with the web app link
bot.onText(/\/game/, (msg) => {
  const chatId = msg.chat.id;

  // Define the Web App URL
  const webAppUrl = 'https://simple-poker-kappa.vercel.app/';

  // Create the inline keyboard with the WebApp button
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: 'Play Simple Poker',
          login_url: { url: webAppUrl },
        }
      ]
    ]
  };

  // Send the message with the Web App button
  bot.sendMessage(chatId, 'Click below to start the game!', {
    reply_markup: replyMarkup
  });
});

// Log that the bot is running
console.log('Bot is running...');
