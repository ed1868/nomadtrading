# TradeSim - Stock Trading Simulator

## Overview

TradeSim is a paper trading application that allows users to practice stock trading with virtual money. Users can buy and sell stocks, trade options, manage a watchlist, and track portfolio performance - all using real-time market data from Finnhub API without risking real money.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, using in-memory storage for portfolio data and PostgreSQL configured via Drizzle ORM for potential persistent storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express 5 with TypeScript
- **API Design**: RESTful endpoints under `/api/*` prefix
- **External Data**: Finnhub API integration for real-time stock quotes, company profiles, and symbol search
- **Development**: Hot module replacement via Vite middleware in development mode

### Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Defined in `shared/schema.ts` using Zod for validation
- **Current Storage**: In-memory storage implementation in `server/storage.ts`
- **Database Ready**: Drizzle config exists for PostgreSQL migration when needed

### Key Design Patterns
- **Monorepo Structure**: Client code in `/client`, server in `/server`, shared types in `/shared`
- **Path Aliases**: `@/*` for client sources, `@shared/*` for shared code
- **Type Safety**: Shared TypeScript interfaces between frontend and backend
- **Component Architecture**: Feature-based components (trading-panel, positions-list, watchlist, etc.)

### Core Features
- Portfolio management with $100,000 virtual starting balance
- Real-time stock quote fetching
- Stock and options trading simulation
- Watchlist management
- Trade history tracking
- Portfolio performance charting with Recharts

## External Dependencies

### APIs
- **Finnhub API**: Real-time stock market data (quotes, company profiles, symbol search)
  - Requires `FINNHUB_API_KEY` environment variable

### Database
- **PostgreSQL**: Configured via Drizzle ORM
  - Requires `DATABASE_URL` environment variable
  - Migrations stored in `/migrations` directory
  - Schema push via `npm run db:push`

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Data fetching and caching
- `recharts`: Portfolio performance charts
- `date-fns`: Date formatting utilities
- `zod`: Runtime type validation
- `wouter`: Client-side routing
- Radix UI primitives: Accessible component foundations