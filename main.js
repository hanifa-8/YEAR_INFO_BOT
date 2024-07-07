require('dotenv').config();
const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const winston = require('winston');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' })
    ],
});

// Command handlers
const commands = {
    '/start': (msg) => {
        bot.sendMessage(msg.chat.id, "Welcome to the Year Info Bot! Send me a year to get interesting facts. Use /help for more commands.");
    },
    '/help': (msg) => {
        bot.sendMessage(msg.chat.id, "Available commands:\n/start - Start the bot\n/help - List available commands\n/yearinfo <year> - Get information about a specific year\n/author - Get information about the author\n/about - Get information about this bot");
    },
    '/author': (msg) => {
        bot.sendMessage(msg.chat.id, "This bot was created by \"MOHAMMED HANIFA BEGUM\".");
    },
    '/about': (msg) => {
        bot.sendMessage(msg.chat.id, "This bot provides interesting facts about different years. Send a year (e.g., 1990) to get started.");
    },
    '/yearinfo': (msg) => {
        const year = msg.text.split(' ')[1];
        const currentYear = new Date().getFullYear();
        if (!isYear(year)) {
            bot.sendMessage(msg.chat.id, 'Please enter a valid year after the command (e.g., /yearinfo 1990).');
        } else if (parseInt(year) > currentYear) {
            bot.sendMessage(msg.chat.id, `The year ${year} has not yet happened. Please enter a year up to ${currentYear}.`);
        } else {
            request(`http://numbersapi.com/${year}/year?write&fragment`, (error, response, body) => {
                if (error) {
                    logger.error(`Error fetching data for year ${year}: ${error.message}`);
                    bot.sendMessage(msg.chat.id, 'Sorry, an error occurred while fetching data. Please try again later.');
                } else {
                    bot.sendMessage(msg.chat.id, `${year}: ${body}`);
                }
            });
        }
    }
};

// Check if the message is a valid year
function isYear(message) {
    const yearRegex = /^\d{4}$/;
    return yearRegex.test(message);
}

// Message handler
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Check if the message is a command
    const command = text.split(' ')[0];
    if (commands[command]) {
        commands[command](msg);
    } else if (isYear(text)) {
        // Handle year information request
        const currentYear = new Date().getFullYear();
        if (parseInt(text) > currentYear) {
            bot.sendMessage(chatId, `The year ${text} has not yet happened. Please enter a year up to ${currentYear}.`);
        } else {
            request(`http://numbersapi.com/${text}/year?write&fragment`, (error, response, body) => {
                if (error) {
                    logger.error(`Error fetching data for year ${text}: ${error.message}`);
                    bot.sendMessage(chatId, 'Sorry, an error occurred while fetching data. Please try again later.');
                } else {
                    bot.sendMessage(chatId, `${text}: ${body}`);
                }
            });
        }
    } else if (text.toLowerCase().includes('hello')) {
        // Handle "hello" message
        bot.sendMessage(chatId, 'Hello! I am a year speciality bot\nEnter a year! to have fun :)');
    } else if (text.toLowerCase().includes('bye')) {
        // Handle "bye" message
        bot.sendMessage(chatId, 'Goodbye! See you next time.');
    } else {
        // Handle invalid input
        bot.sendMessage(chatId, 'Invalid command or year. Use /help to see available commands.');
    }

    // Log the message
    logger.info(`Received message from ${chatId}: ${text}`);
});

// Handle polling errors
bot.on('polling_error', (error) => {
    logger.error(`Polling error: ${error.message}`);
});
