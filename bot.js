require('dotenv').config(); // Carga las claves desde el archivo .env (que está oculto)
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Usamos variables de entorno para no mostrar nada en GitHub
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID; 

const bot = new TelegramBot(token, {polling: true});

// Verificación de arranque
console.log("🤖 DMR4 Quantum: Vigilante activado y protegido.");

bot.onText(/\/status/, (msg) => {
    if(msg.chat.id.toString() === chatId) {
        bot.sendMessage(chatId, "💰 Estado: Patrimonio de \$15,414,019.42 COP bajo vigilancia.");
    }
});

