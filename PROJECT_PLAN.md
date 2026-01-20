# Stock Ticker Tracker - Project Plan

## Project Overview

A web application for tracking Australian and international stock tickers with real-time data, performance metrics, and direct links to Australian brokerages for purchasing.

### Core Features

1. **Add & Track Tickers** - Add stocks like $URG to your watchlist
2. **Detailed Ticker View** - View comprehensive stock information and price charts
3. **Dashboard** - See all tracked tickers with performance metrics (1d, 7d, 30d) and mini charts
4. **Brokerage Links** - Quick links to buy stocks via the cheapest Australian brokers

---

## Tech Stack Recommendation

### Frontend
- **Framework**: Next.js 14+ (React with App Router)
  - Server-side rendering for better performance
  - Built-in API routes for backend
  - Excellent developer experience
- **Styling**: Tailwind CSS
  - Fast development
  - Responsive design out of the box
- **Charts**: Recharts or Lightweight Charts
  - Free, performant charting libraries
  - Good for stock price visualization
- **State Management**: React Query (TanStack Query)
  - Efficient data fetching and caching
  - Perfect for real-time stock data

### Backend
- **Runtime**: Node.js (via Next.js API routes)
- **Database**: SQLite (for simplicity) or PostgreSQL (for production)
  - SQLite: Perfect for getting started, no external dependencies
  - PostgreSQL: Better for scaling, supports JSON columns
- **ORM**: Prisma
  - Type-safe database access
  - Easy migrations
  - Great developer experience

### Stock Market API
**Primary Choice: Finnhub**
- Free tier: 60 API calls/minute
- Supports ASX (Australian stocks)
- Real-time quotes, historical data, company info
- Good documentation
- API Key required (free)

**Backup Option: Alpha Vantage**
- Free tier: 25 API calls/day (very limited)
- Global stock coverage
- Good for historical data

**Alternative: iTick**
- Free tier for ASX-specific data
- Real-time quotes and candlestick data
- WebSocket support for live updates

---

## Database Schema

### Tables

#### `tickers`
```sql
id              INTEGER PRIMARY KEY
symbol          TEXT UNIQUE NOT NULL  -- e.g., "URG.AX" for ASX stocks
exchange        TEXT                  -- e.g., "ASX", "NYSE"
company_name    TEXT
added_at        TIMESTAMP DEFAULT NOW()
notes           TEXT                  -- User notes
```

#### `price_snapshots`
```sql
id              INTEGER PRIMARY KEY
ticker_id       INTEGER REFERENCES tickers(id)
price           DECIMAL(10, 2)
change_percent  DECIMAL(5, 2)
volume          INTEGER
timestamp       TIMESTAMP DEFAULT NOW()
```

#### `cached_stock_data`
```sql
id              INTEGER PRIMARY KEY
ticker_id       INTEGER REFERENCES tickers(id)
data            JSON                  -- Full API response
cached_at       TIMESTAMP DEFAULT NOW()
expires_at      TIMESTAMP             -- Cache expiry (15-30 min)
```

---

## API Endpoints

### Ticker Management
- `GET /api/tickers` - List all tracked tickers
- `POST /api/tickers` - Add new ticker
- `DELETE /api/tickers/:id` - Remove ticker
- `PUT /api/tickers/:id` - Update ticker notes

### Stock Data
- `GET /api/stock/:symbol` - Get detailed stock info
- `GET /api/stock/:symbol/chart` - Get chart data for timeframe
- `GET /api/stock/:symbol/performance` - Get 1d, 7d, 30d performance

### Dashboard
- `GET /api/dashboard` - Get all tickers with summary data

---

## Australian Brokerage Integration

### Recommended Brokers (by cost)

1. **MooMoo** - $0 commission (Best overall)
2. **CMC Markets** - $0 for trades ≤$1,000 (first trade per day)
3. **Superhero** - $2 per trade (Australian shares)
4. **SelfWealth** - $9.50 flat fee
5. **Interactive Brokers** - Best for active/international traders

### Implementation

Create buy links for each ticker:
```javascript
const brokerLinks = {
  moomoo: `https://www.moomoo.com/au/trade/${symbol}`,
  cmcmarkets: `https://www.cmcmarkets.com/en-au/shares/${symbol}`,
  superhero: `https://superhero.com.au/shares/${symbol}`,
  selfwealth: `https://www.selfwealth.com.au/share/${symbol}`,
};
```

Display broker comparison with:
- Commission fees
- Currency conversion fees (for US stocks)
- Special offers

---

## Feature Breakdown

### Phase 1: Core Functionality (MVP)

#### 1.1 Project Setup
- Initialize Next.js project
- Set up Tailwind CSS
- Configure Prisma with SQLite
- Set up environment variables

#### 1.2 Ticker Management
- Add ticker form (input symbol like "URG.AX")
- Validate ticker exists via API
- Store ticker in database
- Display list of tracked tickers
- Remove ticker functionality

#### 1.3 Stock Data Integration
- Set up Finnhub API integration
- Implement API caching (reduce API calls)
- Fetch current price, change %, volume
- Error handling for invalid tickers

#### 1.4 Dashboard View
- Grid/list layout of all tickers
- Show: Symbol, Company Name, Current Price, Change %
- Color coding (green/red for gains/losses)
- Basic mini chart (7-day sparkline)

### Phase 2: Enhanced Features

#### 2.1 Detailed Ticker Page
- Full price chart with timeframe selector (1D, 1W, 1M, 3M, 1Y)
- Company information (sector, market cap, P/E ratio)
- Volume, High, Low, Open, Close
- 52-week high/low

#### 2.2 Performance Metrics
- Calculate and display 1d, 7d, 30d returns
- Percentage and absolute dollar changes
- Cache performance data to reduce API calls

#### 2.3 Brokerage Integration
- "Buy Now" button with broker dropdown
- Display broker fee comparison
- Deep links to broker platforms

### Phase 3: Polish & Optimization

#### 3.1 UI/UX Improvements
- Responsive design (mobile-friendly)
- Loading states and skeletons
- Toast notifications for actions
- Dark mode support

#### 3.2 Performance
- Implement request caching
- Optimize API calls (batch requests)
- Add service worker for offline support

#### 3.3 Additional Features
- Search/filter tickers
- Sort by performance, alphabetical, etc.
- Export watchlist to CSV
- Portfolio value tracking (manual entry of shares owned)

---

## Project Structure

```
stock-tracker/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── tickers/
│   │   │   ├── route.ts          # GET, POST /api/tickers
│   │   │   └── [id]/route.ts     # DELETE, PUT /api/tickers/:id
│   │   ├── stock/
│   │   │   └── [symbol]/
│   │   │       ├── route.ts      # GET /api/stock/:symbol
│   │   │       ├── chart/route.ts
│   │   │       └── performance/route.ts
│   │   └── dashboard/route.ts
│   ├── dashboard/                # Dashboard page
│   │   └── page.tsx
│   ├── ticker/                   # Individual ticker pages
│   │   └── [symbol]/
│   │       └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home/landing page
├── components/                   # React components
│   ├── AddTickerForm.tsx
│   ├── TickerCard.tsx
│   ├── TickerList.tsx
│   ├── StockChart.tsx
│   ├── PerformanceMetrics.tsx
│   └── BrokerLinks.tsx
├── lib/                          # Utility functions
│   ├── db.ts                     # Prisma client
│   ├── finnhub.ts                # API client
│   ├── cache.ts                  # Caching utilities
│   └── utils.ts                  # Helper functions
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure Prisma with SQLite
- [ ] Set up Finnhub API account and test connection
- [ ] Create database schema and run migrations
- [ ] Build basic UI layout (header, navigation)

### Week 2: Core Features
- [ ] Implement Add Ticker functionality
- [ ] Create ticker list/grid view
- [ ] Integrate Finnhub API for live stock data
- [ ] Implement basic caching mechanism
- [ ] Build mini chart component (sparklines)
- [ ] Calculate 1d, 7d, 30d performance

### Week 3: Detailed Views
- [ ] Create detailed ticker page
- [ ] Implement full price chart with Recharts
- [ ] Add timeframe selector
- [ ] Display comprehensive stock information
- [ ] Add broker comparison and buy links

### Week 4: Polish
- [ ] Responsive design testing
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add dark mode
- [ ] Performance optimization
- [ ] Testing and bug fixes

---

## Environment Variables

```env
# .env.local
DATABASE_URL="file:./dev.db"
FINNHUB_API_KEY="your_api_key_here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Getting Started Commands

```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest stock-tracker --typescript --tailwind --app

# Install dependencies
npm install prisma @prisma/client
npm install react-query recharts
npm install axios
npm install @finnhub/node-sdk

# Initialize Prisma
npx prisma init --datasource-provider sqlite

# Run development server
npm run dev
```

---

## API Rate Limit Management

### Finnhub Free Tier
- 60 API calls/minute
- Strategy: Cache aggressively

### Caching Strategy
1. **Real-time quotes**: Cache for 1-5 minutes
2. **Historical data**: Cache for 1 hour
3. **Company info**: Cache for 24 hours
4. **Use database to store snapshots**: Reduce API dependency

### Request Batching
- Fetch dashboard data in a single batched request
- Update all tickers simultaneously
- Display last updated timestamp

---

## Cost Estimate

### Free Tier (Recommended for MVP)
- **Hosting**: Vercel (Free tier)
- **Database**: SQLite (free) or Vercel Postgres (free tier)
- **Stock API**: Finnhub free tier
- **Domain**: Optional (~$12/year)

**Total Monthly Cost: $0**

### Paid Tier (For Scaling)
- **Hosting**: Vercel Pro ($20/month)
- **Database**: Vercel Postgres ($24/month)
- **Stock API**: Finnhub Advanced ($59/month) if free tier insufficient
- **Domain**: $12/year

**Total Monthly Cost: ~$45-105**

---

## Next Steps

1. Review this plan and confirm approach
2. Set up development environment
3. Create Finnhub account (free tier)
4. Initialize Next.js project
5. Start with Phase 1.1 implementation

---

## Resources

### Stock APIs
- [Finnhub Documentation](https://finnhub.io/docs/api)
- [Alpha Vantage](https://www.alphavantage.co/)
- [iTick API](https://blog.itick.org/en/stock-api/2026-australian-stock-market-itick-api-guide)

### Australian Brokers
- [MooMoo AU](https://www.moomoo.com/au/)
- [CMC Markets](https://www.cmcmarkets.com/en-au/)
- [Superhero](https://superhero.com.au/)
- [SelfWealth](https://www.selfwealth.com.au/)

### Tech Docs
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)
