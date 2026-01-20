# Nomad Tradings - AI Nomads Trading Platform

## Overview

Nomad Tradings is a multi-user paper trading platform that allows users to practice stock trading with $100,000 virtual money. Features include real-time stock data from Finnhub API, stock and options trading, AI-powered trading tips, educational content, social features (leaderboard and live trade feed), AI agents for research and analysis, portfolio tracking with performance charts, watchlist management, and trade history.

## Recent Changes (January 2025)
- Converted from single-user in-memory storage to multi-user PostgreSQL database
- Added username/password authentication with passport.js
- Switched AI integration from OpenAI to Claude API (Anthropic)
- Created Discovery tab with educational content about trading concepts
- Added social features: leaderboard and live trade feed
- Added AI Agents tab (Beta) with Research, Sentiment, Game Theory, and Risk agents
- Improved mobile-friendly UI with responsive layouts and bottom navigation
- Updated branding to "Nomad Tradings - AI Nomads Trading Platform"

## User Preferences

Preferred communication style: Simple, everyday language.
Design theme: Professional dark finance theme with green for gains and red for losses

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds
- **Authentication**: Custom useAuth hook with AuthProvider context

### Backend Architecture
- **Framework**: Express 5 with TypeScript
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Authentication**: Passport.js with local strategy, session-based auth with PostgreSQL session store
- **External Data**: Finnhub API integration for real-time stock quotes, company profiles, and symbol search
- **AI Integration**: Claude API (Anthropic) for trading tips and AI agents

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL
- **Database Tables**:
  - `users` - User accounts with hashed passwords and cash balance
  - `positions` - Stock positions (user-specific)
  - `trades` - Trade history (user-specific)
  - `optionPositions` - Options positions (user-specific)
  - `optionTrades` - Options trade history (user-specific)
  - `watchlist` - Watched symbols (user-specific)
  - `portfolioHistory` - Portfolio value history for charts (user-specific)
- **Session Store**: connect-pg-simple for session persistence

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/*` for client sources, `@shared/*` for shared code
- **Type Safety**: Shared TypeScript interfaces between frontend and backend
- **Component Architecture**: Feature-based components

### Core Features
1. **Authentication**: Signup/login with secure password hashing
2. **Portfolio Management**: $100,000 virtual starting balance per user
3. **Real-time Stock Data**: Live quotes from Finnhub API
4. **Stock Trading**: Buy/sell stocks with instant execution
5. **Options Trading**: Trade calls and puts
6. **AI Trading Tips**: Personalized insights based on portfolio (Claude API)
7. **Discovery Tab**: Educational content on trading concepts
8. **Social Features**: Leaderboard and live trade feed
9. **AI Agents (Beta)**: Research, Sentiment, Game Theory, Risk agents
10. **Watchlist**: Track favorite stocks
11. **Performance Charts**: Portfolio value over time

### Pages
- `/` - Dashboard (protected) - Main trading interface with portfolio, positions, trading panel
- `/auth` - Login/register page
- `/discover` - Trading Academy with educational content
- `/social` - Leaderboard and live trade feed
- `/agents` - AI Agents (Beta) for research and analysis

## External Dependencies

### APIs
- **Finnhub API**: Real-time stock market data (quotes, company profiles, symbol search)
  - Requires `FINNHUB_API_KEY` environment variable
- **Claude API (Anthropic)**: AI trading tips and agents
  - Requires `ANTHROPIC_API_KEY` environment variable
  - Uses claude-sonnet-4-20250514 model

### Database
- **PostgreSQL**: Configured via Drizzle ORM
  - Requires `DATABASE_URL` environment variable
  - Migrations stored in `/migrations` directory
  - Schema push via `npm run db:push`

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `passport` / `passport-local`: Authentication
- `connect-pg-simple`: Session storage
- `@tanstack/react-query`: Data fetching and caching
- `@anthropic-ai/sdk`: Claude API client
- `recharts`: Portfolio performance charts
- `date-fns`: Date formatting utilities
- `zod`: Runtime type validation
- `wouter`: Client-side routing
- Radix UI primitives: Accessible component foundations
