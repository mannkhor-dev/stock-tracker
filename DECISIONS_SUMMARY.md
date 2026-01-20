# Key Decisions & Trade-offs Summary

Quick reference for all implementation decisions made during planning interview.

---

## Architecture Decisions

| Decision | Choice | Why | Trade-off |
|----------|--------|-----|-----------|
| **User Model** | Single-user | Faster development, no auth needed | Can't share between users/devices |
| **Database** | SQLite | Zero config, perfect for single-user | Would need migration for multi-user |
| **API Strategy** | Manual refresh | Minimal API usage, user control | Data may be stale |
| **Performance Calc** | Database snapshots | Very efficient, builds history | Initial setup has no history |

## UI/UX Decisions

| Decision | Choice | Why | Trade-off |
|----------|--------|-----|-----------|
| **Dashboard Layout** | Dense grid | See many tickers at once | Less info per ticker |
| **Card Content** | 1d/7d/30d performance | Focus on trends over time | Current price less prominent |
| **Design Style** | Clean & minimal | Easy to build, modern look | Less "trader-focused" feel |
| **Responsiveness** | Desktop-first | Optimized for main use case | Mobile is secondary |

## Technical Decisions

| Decision | Choice | Why | Trade-off |
|----------|--------|-----|-----------|
| **Chart Library** | Lightweight Charts | Purpose-built, performant | More complex API |
| **Ticker Input** | Auto-detect exchange | Better UX | Potential ambiguity |
| **Validation** | API check before save | No invalid data in DB | Extra API call on add |
| **Refresh UX** | All tickers at once | Simple, convenient | Uses more API calls |

## MVP Features (In Scope)

✅ Core Features:
- Add/remove tickers with auto-detect
- Dashboard with dense grid layout
- 1d/7d/30d performance metrics from snapshots
- Search/filter tickers
- Dark mode toggle

✅ Detail Page:
- Split view (chart + stats)
- Lightweight Charts with timeframes
- Broker links section at bottom

❌ Deferred to Later:
- Multi-user support
- Auto-refresh/real-time updates
- Mobile optimization
- Portfolio tracking (shares owned)
- WebSocket live data
- Export to CSV

---

## Technical Stack (Finalized)

```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Charts:    Lightweight Charts (TradingView)
Database:  SQLite via Prisma ORM
API:       Finnhub (free tier, 60/min)
Hosting:   Vercel (free tier)
Theme:     Dark mode with system preference
```

---

## Performance Strategy

### API Usage Optimization
- **Dashboard**: Manual refresh only
- **Snapshots**: Daily job to build history
- **Caching**: Store API responses with expiry
- **Estimated Usage**: 20-30 calls/day (well within limits)

### Data Flow
```
User clicks "Refresh"
  ↓
Fetch current quotes for all tickers
  ↓
Update cached_stock_data table
  ↓
Create price_snapshot record
  ↓
Calculate performance from snapshots
  ↓
Display on dashboard
```

---

## Sprint Plan (3-4 Weeks)

### Week 1: Foundation
- Project setup, database, dark mode, basic layout

### Week 2: Core Features
- Add/remove tickers, dashboard grid, snapshots, performance metrics

### Week 3: Detail Pages
- Charts, stats panel, broker links

### Week 4: Polish
- Responsive design, error handling, testing, deployment

---

## Critical Design Patterns

### 1. Snapshot System
```typescript
// Run daily or on-demand
captureSnapshots() {
  for each ticker:
    fetch current price
    save to price_snapshots table
}

// Calculate performance
calculate7DayReturn(tickerId) {
  current = latest snapshot
  weekAgo = snapshot from 7 days ago
  return (current - weekAgo) / weekAgo * 100
}
```

### 2. Auto-Detect Exchange
```typescript
addTicker(symbol) {
  // Try ASX first
  data = await api.quote(`${symbol}.AX`)

  if (!data) {
    // Fallback to US markets
    data = await api.quote(symbol)
  }

  if (!data) throw "Not found"

  // Confirm with user before saving
  showConfirmation(data.companyName, data.fullSymbol)
}
```

### 3. Dark Mode
```typescript
// CSS variables in global.css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 15%;
}

// Use in components
<div className="bg-background text-foreground">
  <div className="bg-card">...</div>
</div>
```

---

## Broker Integration

Fixed list, no API needed:

| Broker | Fee | Notes |
|--------|-----|-------|
| MooMoo | $0 | Best overall ⭐ |
| CMC Markets | $0* | *First trade/day ≤$1,000 |
| Superhero | $2 | Flat fee |
| SelfWealth | $9.50 | Flat fee |

Links format: `https://broker.com/trade/${symbol}`

---

## Open Questions / Future Considerations

1. **Snapshot frequency**: Daily? Hourly? On-demand only?
2. **Historical data backfill**: Should we fetch 1 year of history on ticker add?
3. **Error recovery**: What if API is down when user clicks refresh?
4. **Data retention**: Keep all snapshots forever or prune old data?
5. **Chart data caching**: Store in DB or fetch live from API?

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| API rate limits | Manual refresh + aggressive caching |
| Invalid tickers | Validate before save, show clear errors |
| Stale data | Show "last updated" timestamp |
| Database growth | SQLite handles millions of rows fine |
| Chart complexity | Use Lightweight Charts examples as reference |
| Dark mode bugs | Test both themes for all components |

---

## Success Metrics

✅ Can add Australian and US tickers easily
✅ Dashboard loads < 1 second (from cache)
✅ Charts are interactive and responsive
✅ Dark mode works throughout app
✅ Search quickly finds tickers
✅ Broker links work correctly
✅ Performance metrics are accurate

---

Ready to implement? See IMPLEMENTATION_SPEC.md for detailed technical specs.
