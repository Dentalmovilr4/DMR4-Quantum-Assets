# DMR4 Quantum Assets

A portfolio monitoring and asset management dashboard for Dentalmovilr4.

## Overview

Real-time web interface for visualizing a personal investment portfolio (Ecopetrol, Apple, ETF Gold, Bitcoin) with Firebase synchronization and a companion Telegram bot for notifications.

## Architecture

- **Frontend**: Static HTML/CSS/JS in `public/` served via `serve` on port 5000
- **Backend Bot**: `bot.js` — Node.js Telegram bot (run separately with `npm run bot`)
- **Database**: Firebase Realtime Database for portfolio sync
- **Charts**: Chart.js via CDN

## Project Structure

```
/
├── public/
│   ├── index.html        # Main dashboard UI
│   ├── css/style.css     # Neon/dark theme styling
│   └── js/
│       ├── app.js        # Core frontend logic + Firebase sync
│       └── config.js     # Firebase configuration (add your keys here)
├── bot.js                # Telegram bot
├── package.json
└── .env                  # Environment variables (not committed)
```

## Configuration Required

### Firebase (`public/js/config.js`)
Fill in your Firebase project credentials:
- `apiKey`
- `messagingSenderId`
- `appId`

### Telegram Bot (`.env` file)
```
TELEGRAM_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Firebase Admin (`serviceAccountKey.json`)
Download from Firebase Console > Project Settings > Service Accounts and place in the project root.

## Running

- **Frontend only**: `npm start` (serves on port 5000)
- **Telegram bot**: `npm run bot`

## Deployment

Configured as a static site deployment using the `public/` directory.
