import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { finnhubClient } from '@/lib/finnhub';

/**
 * POST /api/tickers/refresh
 * Manually refresh all ticker data
 */
export async function POST() {
  try {
    const tickers = await prisma.ticker.findMany();

    if (tickers.length === 0) {
      return NextResponse.json({ message: 'No tickers to refresh' });
    }

    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          // Fetch current quote
          const quote = await finnhubClient.getQuote(ticker.symbol);

          if (!quote) {
            throw new Error(`Failed to fetch quote for ${ticker.symbol}`);
          }

          // Update cached data
          await prisma.cachedStockData.upsert({
            where: { tickerId: ticker.id },
            update: {
              currentPrice: quote.c,
              openPrice: quote.o,
              highPrice: quote.h,
              lowPrice: quote.l,
              previousClose: quote.pc,
              cachedAt: new Date(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            },
            create: {
              tickerId: ticker.id,
              currentPrice: quote.c,
              openPrice: quote.o,
              highPrice: quote.h,
              lowPrice: quote.l,
              previousClose: quote.pc,
              cachedAt: new Date(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
          });

          // Create a new snapshot
          await prisma.priceSnapshot.create({
            data: {
              tickerId: ticker.id,
              price: quote.c,
              changePercent: quote.dp,
              volume: null,
              timestamp: new Date(),
            },
          });

          return {
            symbol: ticker.symbol,
            success: true,
          };
        } catch (error) {
          console.error(`Error refreshing ${ticker.symbol}:`, error);
          return {
            symbol: ticker.symbol,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    return NextResponse.json({
      message: `Refreshed ${successful}/${tickers.length} tickers`,
      successful,
      failed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
      ),
    });
  } catch (error) {
    console.error('Error refreshing tickers:', error);
    return NextResponse.json(
      { error: 'Failed to refresh tickers' },
      { status: 500 }
    );
  }
}
