import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculatePercentChange } from '@/lib/utils';

/**
 * GET /api/dashboard
 * Get all tickers with performance metrics calculated from snapshots
 */
export async function GET() {
  try {
    const tickers = await prisma.ticker.findMany({
      include: {
        cachedData: true,
        snapshots: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    // Calculate performance metrics for each ticker
    const tickersWithMetrics = tickers.map((ticker) => {
      const snapshots = ticker.snapshots;
      const currentPrice = ticker.cachedData?.currentPrice || 0;

      // Find snapshots for 1d, 7d, 30d ago
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Find closest snapshots to each timeframe
      const snapshot1d = snapshots.find(
        (s) => s.timestamp <= oneDayAgo
      );
      const snapshot7d = snapshots.find(
        (s) => s.timestamp <= sevenDaysAgo
      );
      const snapshot30d = snapshots.find(
        (s) => s.timestamp <= thirtyDaysAgo
      );

      // Calculate performance
      const performance1d = snapshot1d
        ? calculatePercentChange(currentPrice, snapshot1d.price)
        : null;
      const performance7d = snapshot7d
        ? calculatePercentChange(currentPrice, snapshot7d.price)
        : null;
      const performance30d = snapshot30d
        ? calculatePercentChange(currentPrice, snapshot30d.price)
        : null;

      return {
        id: ticker.id,
        symbol: ticker.symbol,
        displaySymbol: ticker.displaySymbol,
        exchange: ticker.exchange,
        companyName: ticker.companyName,
        currentPrice,
        openPrice: ticker.cachedData?.openPrice,
        highPrice: ticker.cachedData?.highPrice,
        lowPrice: ticker.cachedData?.lowPrice,
        previousClose: ticker.cachedData?.previousClose,
        changePercent: currentPrice && ticker.cachedData?.previousClose
          ? calculatePercentChange(currentPrice, ticker.cachedData.previousClose)
          : 0,
        performance: {
          '1d': performance1d,
          '7d': performance7d,
          '30d': performance30d,
        },
        lastUpdated: ticker.cachedData?.cachedAt || ticker.addedAt,
        notes: ticker.notes,
      };
    });

    return NextResponse.json(tickersWithMetrics);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
