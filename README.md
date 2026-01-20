# Stock Ticker Tracker

A modern web application for tracking Australian and international stock tickers with real-time data, performance metrics, and direct links to Australian brokerages.

## Features

- Add and track your favorite stock tickers (e.g., $URG)
- Dashboard view with all tickers and performance metrics (1d, 7d, 30d)
- Detailed ticker pages with interactive price charts
- Mini sparkline charts on dashboard
- Direct buy links to cheapest Australian brokers (MooMoo, CMC Markets, Superhero, etc.)
- Real-time stock data via Finnhub API

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Charts**: Recharts
- **Stock API**: Finnhub (free tier)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Finnhub API key (free at https://finnhub.io/)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Finnhub API key:
```env
DATABASE_URL="file:./dev.db"
FINNHUB_API_KEY="your_api_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Initialize database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## Project Structure

```
stock-tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   └── ticker/            # Ticker detail pages
├── components/            # React components
├── lib/                   # Utilities and API clients
├── prisma/               # Database schema
└── public/               # Static assets
```

## Development Roadmap

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the complete implementation plan.

### Phase 1: MVP (Week 1-2)
- [ ] Project setup
- [ ] Basic ticker management
- [ ] Dashboard with mini charts
- [ ] Stock data integration

### Phase 2: Enhanced Features (Week 3)
- [ ] Detailed ticker pages
- [ ] Full interactive charts
- [ ] Broker integration

### Phase 3: Polish (Week 4)
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Dark mode

## API Rate Limits

Finnhub free tier: 60 calls/minute

Caching strategy:
- Real-time quotes: 5 minutes
- Historical data: 1 hour
- Company info: 24 hours

## Australian Brokers Supported

1. **MooMoo** - $0 commission
2. **CMC Markets** - $0 for trades ≤$1,000
3. **Superhero** - $2 per trade
4. **SelfWealth** - $9.50 flat fee
5. **Interactive Brokers** - Best for active traders

## License

MIT
