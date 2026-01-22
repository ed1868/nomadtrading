# Nomad Tradings - AI Stock Market Simulator

A full-featured paper trading platform that allows users to practice stock and cryptocurrency trading with $100,000 in virtual money. Combines real-time market data with AI-powered trading analysis, social features, and a competitive leaderboard.

## Features

### Trading
- **Stock Trading** - Buy and sell stocks with real-time pricing from Finnhub API
- **Options Trading** - Trade call and put options with strike prices and expiration dates
- **Cryptocurrency Support** - Trade popular cryptocurrencies including Bitcoin and Ethereum
- **Paper Trading** - Practice with $100,000 virtual starting capital per user

### Portfolio Management
- Real-time portfolio valuation and P&L tracking
- Position tracking with average cost basis
- Interactive portfolio performance charts
- Complete trade history with timestamps

### AI-Powered Features
- **AI Trading Tips** - Personalized recommendations powered by Claude AI based on your portfolio
- **AI Agents (Beta)** - Research, Sentiment, Game Theory, and Risk analysis agents

### Social & Community
- **Live Trade Feed** - View trades from all users in real-time
- **Leaderboard** - Compete with other traders by portfolio performance
- **Message Board** - Share trading ideas with sentiment tags (bullish/bearish/neutral)
- **Like System** - Engage with community posts

### Educational
- **Trading Academy** - Learn trading concepts through the Discovery tab

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TanStack React Query
- Tailwind CSS + shadcn/ui
- Framer Motion
- Recharts
- Wouter (routing)

**Backend:**
- Express 5 + TypeScript
- Node.js 20
- Drizzle ORM
- Passport.js (authentication)

**Database:**
- PostgreSQL 16

**External APIs:**
- Finnhub (real-time stock data)
- Anthropic Claude (AI features)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
├── server/                 # Express backend
│   ├── routes.ts          # API endpoints
│   ├── auth.ts            # Authentication
│   ├── storage.ts         # Database operations
│   └── finnhub.ts         # Stock data API
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schemas & validators
└── migrations/             # Database migrations
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- [Finnhub API Key](https://finnhub.io/) (free tier available)
- [Anthropic API Key](https://console.anthropic.com/) (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Stock-MarketSim
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/stocksim
   FINNHUB_API_KEY=your_finnhub_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   SESSION_SECRET=your_session_secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## API Endpoints

### Public
- `GET /api/quote/:symbol` - Get stock quote
- `GET /api/profile/:symbol` - Get company profile
- `GET /api/search?q=query` - Search stocks
- `GET /api/leaderboard` - Public leaderboard
- `GET /api/posts` - Community posts

### Protected (requires authentication)
- `GET /api/portfolio` - User's portfolio summary
- `GET /api/positions` - User's stock positions
- `POST /api/trades/buy` - Buy stocks
- `POST /api/trades/sell` - Sell stocks
- `POST /api/options/trade` - Trade options
- `GET /api/watchlist` - User's watchlist
- `POST /api/ai/tips` - Get AI trading tips

## License

MIT
