require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

const token = process.env.TELEGRAM_TOKEN;
const chatId = '1883532625';
const DATABASE_URL = "https://dentalmovilr4-eab7b-default-rtdb.firebaseio.com/";

const bot = new TelegramBot(token, {polling: true});

try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DATABASE_URL
    });
    console.log("✅ Conexión segura establecida con Firebase.");
    
    const db = admin.database();
    const ref = db.ref('portfolio/config');

    ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const mensaje = "🚀 *DMR4 QUANTUM - MONITOREO ACTIVO*\n\n" +
                            "💰 *Patrimonio:* 5,414,019.42 COP\n" +
                            "💎 *Estado:* Protegido 24/7";
            bot.sendMessage(chatId, mensaje, {parse_mode: 'Markdown'});
        }
    });
} catch (e) { console.log("⚠️ Esperando credenciales..."); }
