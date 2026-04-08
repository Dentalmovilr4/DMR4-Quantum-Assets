require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// --- CONFIGURACIÓN SEGURA (Sin claves reales) ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Inicialización del Bot
const bot = new TelegramBot(token, {polling: true});

// Firebase Admin (Carga el archivo de credenciales localmente)
try {
    const serviceAccount = require("./serviceAccountKey.json");
        admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                        databaseURL: "https://dentalmovilr4-eab7b-default-rtdb.firebaseio.com/"
                            });
                                console.log("✅ Firebase conectado con éxito.");
                                } catch (error) {
                                    console.log("⚠️ Error cargando serviceAccountKey.json o Firebase no configurado.");
                                    }

                                    console.log("🤖 DMR4 Quantum: Bot en línea y protegido por Dentalmovilr4.");

                                    // Comando de prueba
                                    bot.onText(/\/status/, (msg) => {
                                        // Solo responde si el chatId coincide con el tuyo
                                            if (msg.chat.id.toString() === chatId) {
                                                    bot.sendMessage(chatId, "💰 Monitoreo Dentalmovilr4: Activo.\nPatrimonio: $15,414,019.42 COP");
                                                        } else {
                                                                console.log(`Intento de acceso no autorizado del ID: ${msg.chat.id}`);
                                                                    }
                                                                    });
                                                                    