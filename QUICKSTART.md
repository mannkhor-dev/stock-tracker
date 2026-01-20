# Quick Start Guide

Get your stock ticker tracker up and running in 5 minutes!

## Step 1: Get a Finnhub API Key (2 minutes)

1. Go to https://finnhub.io/
2. Click "Get free API key"
3. Sign up with email
4. Copy your API key

## Step 2: Run Setup Script (2 minutes)

```bash
./setup.sh
```

This will:
- Initialize Next.js with TypeScript and Tailwind
- Install all required dependencies
- Set up Prisma with SQLite
- Create database schema
- Generate environment files

## Step 3: Configure Environment (1 minute)

Edit `.env.local` and add your Finnhub API key:

```env
FINNHUB_API_KEY="paste_your_key_here"
```

## Step 4: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## What to Build First

Follow the implementation phases in PROJECT_PLAN.md:

### Phase 1: MVP (Days 1-7)
Start with these core features:

1. **Add Ticker Form**
   - Create `components/AddTickerForm.tsx`
   - Simple input for stock symbol
   - Validate and save to database

2. **Ticker List**
   - Create `components/TickerList.tsx`
   - Display all tracked tickers
   - Show current price and change %

3. **Dashboard Page**
   - Create `app/dashboard/page.tsx`
   - Grid layout of ticker cards
   - Mini charts for each ticker

4. **API Integration**
   - Create `lib/finnhub.ts` API client
   - Implement caching in `lib/cache.ts`
   - Create API routes in `app/api/`

### Phase 2: Enhanced Features (Days 8-14)
- Detailed ticker pages with full charts
- Performance metrics (1d, 7d, 30d)
- Broker comparison links

### Phase 3: Polish (Days 15-21)
- Responsive design
- Loading states
- Dark mode
- Performance optimization

## Key Files to Create First

```
app/
  dashboard/
    page.tsx                 # Main dashboard
  ticker/
    [symbol]/
      page.tsx              # Ticker detail page
  api/
    tickers/
      route.ts              # CRUD operations
    stock/
      [symbol]/
        route.ts            # Stock data

components/
  AddTickerForm.tsx         # Form to add tickers
  TickerCard.tsx            # Dashboard ticker card
  TickerList.tsx            # List of all tickers
  StockChart.tsx            # Chart component

lib/
  finnhub.ts                # API client
  db.ts                     # Prisma client
  cache.ts                  # Caching utilities
```

## Sample Tickers to Test With

### Australian Stocks (ASX)
- CBA.AX - Commonwealth Bank
- BHP.AX - BHP Group
- CSL.AX - CSL Limited
- NAB.AX - National Australia Bank
- WBC.AX - Westpac Banking

### US Stocks
- AAPL - Apple
- MSFT - Microsoft
- GOOGL - Google
- TSLA - Tesla
- NVDA - NVIDIA

## Troubleshooting

### Prisma Issues
```bash
npx prisma generate
npx prisma migrate reset
```

### API Rate Limits
If you hit Finnhub rate limits:
- Implement caching (5-15 minute cache)
- Reduce dashboard refresh rate
- Use database snapshots for historical data

### Next.js Issues
```bash
rm -rf .next
npm run dev
```

## Development Tips

1. **Start Simple**: Get basic CRUD working first
2. **Cache Aggressively**: Store API responses in database
3. **Use React Query**: Automatic caching and refetching
4. **Mobile First**: Design for mobile, scale up
5. **Test with Real Data**: Use actual ASX tickers

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Finnhub API Docs](https://finnhub.io/docs/api)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts Examples](https://recharts.org/en-US/examples)

## Support

- Check PROJECT_PLAN.md for detailed architecture
- Finnhub has 60 API calls/minute on free tier
- Use SQLite for development (no setup required)
- Vercel deployment is free for hobby projects

---

Ready to build? Start with `./setup.sh` and follow Phase 1 in the project plan!
