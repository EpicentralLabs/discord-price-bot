# Epicentral Discord Bot

A Discord bot that tracks and displays LABS token prices and liquidity information using Jupiter and BirdEye APIs.

## Features

- Real-time price tracking for LABS and SOL tokens
- Automatic bot status updates showing current LABS price
- Slash command `/price-labs` or `price-wattlabs` to get detailed token information:
  - LABS or wattLABS token price in USD
  - LABS or wattLABS/SOL ratio
  - Current liquidity
  - SOL price in USD

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file based on `.env.example`:
```properties
DISCORD_TOKEN=your_discord_bot_token
BIRDEYE_TOKEN=your_birdeye_api_key
```
4. Build the project:
```bash
npm run build
```
5. Start the bot:
```bash
npm start
```

## Development

- Run in development mode with hot reload:
```bash
npm run dev
```
- Watch for TypeScript changes:
```bash
npm run watch
```

## Configuration

Key settings can be modified in `src/config.ts`:
- `UPDATE_INTERVAL`: How often the bot updates prices (in seconds)
- `PRICE_DECIMAL_PLACES`: Number of decimal places for price display
- `DEFAULT_GUILD_ID`: Discord server ID for commands registration

## Tech Stack

- TypeScript
- discord.js
- Node.js
- Jupiter API
- BirdEye API