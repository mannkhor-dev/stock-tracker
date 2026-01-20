# Implementation Specification
## Based on User Interview - 2026-01-20

This document captures the specific implementation decisions based on your requirements.

---

## Core Decisions Summary

### User Experience
- **User Model**: Single-user application (no authentication required)
- **Primary Use**: Desktop-first design
- **Design Aesthetic**: Clean & minimal with lots of whitespace
- **Theme**: Dark mode toggle included in MVP

### Dashboard Design
- **Layout**: Dense grid - optimized to show many tickers at once
- **Card Content Priority**: 1d/7d/30d performance comparison
- **Additional Features**: Search/filter functionality for tickers
- **Data Updates**: Manual refresh button (all tickers refresh at once)

### Technical Stack
- **Database**: SQLite (single file, zero configuration)
- **Charting Library**: Lightweight Charts by TradingView
- **Stock API**: Finnhub (free tier, 60 calls/minute)
- **Framework**: Next.js 14 with TypeScript & Tailwind CSS

### Ticker Management
- **Symbol Input**: Auto-detect exchange (tries ASX first, then US markets)
- **Validation**: API validation before adding to database
- **Error Handling**: Show clear error messages for invalid symbols

### Detail Page
- **Layout**: Split view - 50% chart, 50% comprehensive stats
- **Broker Links**: Always visible section at bottom of page
- **Chart Timeframes**: 1D, 1W, 1M, 3M, 1Y selectors

### Performance Metrics
- **Calculation Method**: Database snapshots (efficient, reduces API calls)
- **Strategy**: Store daily price snapshots, calculate performance from cached data
- **Timeframes**: 1 day, 7 day, 30 day percentage changes

---

## Key Technical Implications

### 1. Single-User Architecture

**Benefits:**
- No authentication complexity
- Simpler database schema (no user table, no foreign keys to users)
- Faster development
- No session management or password security concerns

**Trade-offs:**
- Cannot be used by multiple people without data conflicts
- No cloud sync between devices
- Easy to convert to multi-user later if needed

**Implementation:**
```typescript
// Database schema is simplified
model Ticker {
  id      Int    @id @default(autoincrement())
  symbol  String @unique
  // No userId field needed
}
```

### 2. Manual Refresh Strategy

**Benefits:**
- Minimal API usage (stays well within 60 calls/minute limit)
- User controls when data is fetched
- Lower server costs and API quota consumption
- No background polling complexity

**Trade-offs:**
- Data may be stale if user forgets to refresh
- No real-time price updates
- Requires user action to see latest prices

**Implementation:**
```typescript
// Dashboard has single "Refresh All" button
// Shows "Last updated: X minutes ago" timestamp
// On click, fetches all tickers sequentially or in batches
```

### 3. Lightweight Charts (TradingView)

**Benefits:**
- Purpose-built for financial data visualization
- Extremely performant (WebGL-based rendering)
- Smaller bundle size than Recharts
- Professional-looking charts used by TradingView

**Trade-offs:**
- More imperative API (less React-friendly)
- Requires refs and lifecycle management
- Steeper learning curve than Recharts
- More complex to customize styling

**Example Code:**
```typescript
// Lightweight Charts uses imperative API
import { createChart } from 'lightweight-charts';

useEffect(() => {
  const chart = createChart(chartContainerRef.current, {
    width: 600,
    height: 400,
  });

  const series = chart.addAreaSeries();
  series.setData(priceData);

  return () => chart.remove();
}, [priceData]);
```

vs. Recharts (declarative):
```typescript
<LineChart data={priceData}>
  <Line dataKey="price" />
</LineChart>
```

### 4. Database Snapshot Strategy

**Benefits:**
- Drastically reduces API calls for performance metrics
- Can show historical trends even if API is down
- Fast dashboard loading (no API calls needed)
- Builds up historical database over time

**Trade-offs:**
- Requires background job or cron to populate snapshots
- Initial setup has no historical data
- Need to decide snapshot frequency (hourly? daily?)
- Database grows over time (but SQLite handles this well)

**Implementation Strategy:**
```typescript
// Daily snapshot job (can run via cron or manual trigger)
async function captureSnapshots() {
  const tickers = await getAllTickers();

  for (const ticker of tickers) {
    const price = await fetchCurrentPrice(ticker.symbol);

    await db.priceSnapshot.create({
      data: {
        tickerId: ticker.id,
        price: price.current,
        changePercent: price.changePercent,
        volume: price.volume,
        timestamp: new Date()
      }
    });
  }
}

// Calculate performance from snapshots
async function calculate30DayPerformance(tickerId: number) {
  const now = await db.priceSnapshot.findFirst({
    where: { tickerId },
    orderBy: { timestamp: 'desc' }
  });

  const thirtyDaysAgo = await db.priceSnapshot.findFirst({
    where: {
      tickerId,
      timestamp: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    orderBy: { timestamp: 'desc' }
  });

  if (!now || !thirtyDaysAgo) return null;

  return ((now.price - thirtyDaysAgo.price) / thirtyDaysAgo.price) * 100;
}
```

### 5. Auto-Detect Exchange

**Benefits:**
- Better user experience (just type "CBA" instead of "CBA.AX")
- Feels more intuitive
- Can show suggestions/confirmations

**Trade-offs:**
- Ambiguity risk (same symbol on multiple exchanges)
- Requires symbol lookup/search API
- Need fallback logic (try ASX first, then US)

**Implementation:**
```typescript
async function addTicker(symbol: string) {
  // Try ASX first
  let tickerData = await finnhub.getQuote(`${symbol}.AX`);

  if (!tickerData) {
    // Try US markets
    tickerData = await finnhub.getQuote(symbol);
  }

  if (!tickerData) {
    throw new Error(`Ticker ${symbol} not found`);
  }

  // Show confirmation with full company name
  // "Add Commonwealth Bank of Australia (CBA.AX)?"

  return tickerData;
}
```

### 6. Desktop-First Design

**Benefits:**
- Can use more complex layouts and denser information
- Larger charts and more visible data
- Easier to implement (simpler responsive logic)
- Optimized for your primary use case

**Trade-offs:**
- Mobile experience is secondary
- May not be as touch-friendly
- Smaller screens get scaled-down version

**CSS Approach:**
```css
/* Desktop-first: start with desktop styles, scale down */
.ticker-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 columns on desktop */
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .ticker-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on tablet */
  }
}

@media (max-width: 640px) {
  .ticker-grid {
    grid-template-columns: 1fr; /* 1 column on mobile */
  }
}
```

---

## Updated Database Schema

Based on snapshot strategy and single-user model:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Ticker {
  id            Int              @id @default(autoincrement())
  symbol        String           @unique  // Full symbol with exchange (e.g., "CBA.AX", "AAPL")
  displaySymbol String                    // User-friendly symbol (e.g., "CBA", "AAPL")
  exchange      String                    // "ASX", "NYSE", "NASDAQ"
  companyName   String?
  addedAt       DateTime         @default(now())
  notes         String?

  snapshots     PriceSnapshot[]
  cachedData    CachedStockData?

  @@index([symbol])
}

model PriceSnapshot {
  id            Int       @id @default(autoincrement())
  tickerId      Int
  price         Float
  changePercent Float?
  volume        Int?
  timestamp     DateTime  @default(now())

  ticker        Ticker    @relation(fields: [tickerId], references: [id], onDelete: Cascade)

  @@index([tickerId, timestamp])
}

model CachedStockData {
  id            Int       @id @default(autoincrement())
  tickerId      Int       @unique

  // Current quote data (refreshed manually)
  currentPrice  Float?
  openPrice     Float?
  highPrice     Float?
  lowPrice      Float?
  previousClose Float?

  // Company fundamentals (cached for 24 hours)
  marketCap     Float?
  peRatio       Float?
  week52High    Float?
  week52Low     Float?
  sector        String?

  // Chart data (1 year of daily prices)
  chartData     String?   // JSON string of price history

  cachedAt      DateTime  @default(now())
  expiresAt     DateTime

  ticker        Ticker    @relation(fields: [tickerId], references: [id], onDelete: Cascade)

  @@index([tickerId])
}

// Settings table for app preferences (dark mode, etc.)
model AppSettings {
  id            Int       @id @default(autoincrement())
  key           String    @unique
  value         String
  updatedAt     DateTime  @updatedAt
}
```

---

## Updated Component Structure

Based on your preferences:

```
components/
├── layout/
│   ├── Header.tsx              # Top nav with logo, search, theme toggle
│   ├── ThemeProvider.tsx       # Dark mode context
│   └── Layout.tsx              # Wrapper with header
│
├── dashboard/
│   ├── DashboardGrid.tsx       # Main grid layout
│   ├── TickerCard.tsx          # Individual ticker card
│   ├── RefreshButton.tsx       # Manual refresh all
│   ├── SearchBar.tsx           # Filter tickers
│   └── PerformanceMetrics.tsx  # 1d/7d/30d display
│
├── ticker-detail/
│   ├── ChartSection.tsx        # Left side - Lightweight Charts
│   ├── StatsSection.tsx        # Right side - all metrics
│   ├── TimeframeSelector.tsx   # 1D/1W/1M/3M/1Y buttons
│   └── BrokerLinks.tsx         # Buy section at bottom
│
├── forms/
│   ├── AddTickerForm.tsx       # Input with auto-detect
│   └── AddTickerModal.tsx      # Modal wrapper
│
└── ui/
    ├── Button.tsx              # Reusable button
    ├── Card.tsx                # Card container
    ├── Badge.tsx               # For change % indicators
    └── Spinner.tsx             # Loading states
```

---

## MVP Feature Priority (Refined)

Based on your selections, here's the recommended build order:

### Sprint 1: Foundation (Days 1-3)
1. ✅ Project setup (Next.js, Tailwind, Prisma, SQLite)
2. ✅ Database schema and migrations
3. ✅ Basic layout with header and dark mode toggle
4. ✅ Theme provider and dark mode implementation

### Sprint 2: Core Ticker Management (Days 4-7)
5. ✅ Add ticker form with auto-detect
6. ✅ API validation before saving
7. ✅ List/grid view of tickers
8. ✅ Delete ticker functionality
9. ✅ Search/filter tickers

### Sprint 3: Dashboard with Performance (Days 8-12)
10. ✅ Finnhub API integration
11. ✅ Manual refresh button
12. ✅ Price snapshot system
13. ✅ Calculate 1d/7d/30d performance from snapshots
14. ✅ Dense grid layout with performance metrics
15. ✅ Color coding (green/red for gains/losses)

### Sprint 4: Detailed Ticker Page (Days 13-17)
16. ✅ Split layout (chart + stats)
17. ✅ Lightweight Charts integration
18. ✅ Timeframe selector
19. ✅ Comprehensive stats panel
20. ✅ Broker links section

### Sprint 5: Polish (Days 18-21)
21. ✅ Responsive design testing
22. ✅ Loading states and error handling
23. ✅ Dark mode refinements
24. ✅ Performance optimization
25. ✅ Final testing and bug fixes

---

## API Usage Optimization

With manual refresh and snapshot strategy:

### API Call Breakdown
**Dashboard Refresh (10 tickers):**
- 10 quote API calls (current prices)
- 0 historical calls (using snapshots)
- Total: ~10 calls

**Detail Page Load:**
- 1 quote API call (if not recently cached)
- 1 historical data call (chart data)
- 1 company profile call
- Total: ~3 calls

**Daily Snapshot Job (optional):**
- 10 quote calls per day (one per ticker)
- Run once daily to build history
- Total: ~10 calls/day

**Estimated Total Usage:**
- Active usage: ~20-30 calls per day
- Well within 60 calls/minute limit (86,400 calls/day theoretical max)
- No risk of hitting rate limits

---

## Dark Mode Implementation

Using CSS variables and Tailwind's dark mode:

```typescript
// components/layout/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load from localStorage or system preference
    const stored = localStorage.getItem('theme');
    if (stored) {
      setTheme(stored as 'light' | 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

```typescript
// Tailwind config
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Define semantic colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
      }
    }
  }
}
```

---

## Broker Links Implementation

Bottom section on detail page:

```typescript
// components/ticker-detail/BrokerLinks.tsx

const BROKERS = [
  {
    name: 'MooMoo',
    fee: '$0',
    feeType: 'commission',
    url: (symbol: string) => `https://www.moomoo.com/au/trade/${symbol}`,
    recommended: true,
  },
  {
    name: 'CMC Markets',
    fee: '$0',
    feeNote: 'First trade per day ≤$1,000',
    url: (symbol: string) => `https://www.cmcmarkets.com/en-au/shares/${symbol}`,
  },
  {
    name: 'Superhero',
    fee: '$2',
    feeType: 'per trade',
    url: (symbol: string) => `https://superhero.com.au/shares/${symbol}`,
  },
  {
    name: 'SelfWealth',
    fee: '$9.50',
    feeType: 'flat fee',
    url: (symbol: string) => `https://www.selfwealth.com.au/share/${symbol}`,
  },
];

export function BrokerLinks({ symbol }: { symbol: string }) {
  return (
    <div className="mt-8 p-6 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Buy {symbol}</h3>
      <div className="grid grid-cols-2 gap-4">
        {BROKERS.map(broker => (
          <a
            key={broker.name}
            href={broker.url(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-lg hover:border-blue-500 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{broker.name}</div>
                {broker.feeNote && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {broker.feeNote}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {broker.fee}
                </div>
                {broker.feeType && (
                  <div className="text-xs text-muted-foreground">
                    {broker.feeType}
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## Next Steps

1. Review this spec and confirm approach
2. Get Finnhub API key (https://finnhub.io/)
3. Run `./setup.sh` to initialize project
4. Begin Sprint 1 implementation

**Estimated Total Development Time:** 3-4 weeks (part-time) or 2-3 weeks (full-time)

---

## Questions or Concerns?

Before we start implementing, any questions about:
- Technical trade-offs?
- Feature prioritization?
- Design decisions?
- API usage strategy?
