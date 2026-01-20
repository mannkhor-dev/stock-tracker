import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { finnhubClient } from '@/lib/finnhub';
import { getCurrentTimestamp, getDaysAgoTimestamp } from '@/lib/utils';

/**
 * GET /api/tickers
 * Get all tracked tickers
 */
export async function GET() {
  try {
    const tickers = await prisma.ticker.findMany({
      include: {
        cachedData: true,
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json(tickers);
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickers
 * Add a new ticker with auto-detect exchange
 * Body: { symbol: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, notes } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Auto-detect the exchange and validate the symbol
    const detected = await finnhubClient.autoDetectSymbol(symbol);

    if (!detected) {
      return NextResponse.json(
        { error: `Ticker ${symbol} not found. Please check the symbol and try again.` },
        { status: 404 }
      );
    }

    // Check if ticker already exists
    const existing = await prisma.ticker.findUnique({
      where: { symbol: detected.fullSymbol },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ticker ${detected.displaySymbol} (${detected.fullSymbol}) is already in your watchlist` },
        { status: 409 }
      );
    }

    // Fetch current quote
    const quote = await finnhubClient.getQuote(detected.fullSymbol);

    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to fetch ticker data' },
        { status: 500 }
      );
    }

    // Fetch 1 year of historical data for chart
    const oneYearAgo = getDaysAgoTimestamp(365);
    const now = getCurrentTimestamp();
    const candles = await finnhubClient.getCandles(
      detected.fullSymbol,
      'D', // Daily
      oneYearAgo,
      now
    );

    // Create ticker in database
    const ticker = await prisma.ticker.create({
      data: {
        symbol: detected.fullSymbol,
        displaySymbol: detected.displaySymbol,
        exchange: detected.exchange,
        companyName: detected.companyName,
        notes: notes || null,
        cachedData: {
          create: {
            currentPrice: quote.c,
            openPrice: quote.o,
            highPrice: quote.h,
            lowPrice: quote.l,
            previousClose: quote.pc,
            chartData: candles ? JSON.stringify(candles) : null,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          },
        },
        snapshots: {
          create: {
            price: quote.c,
            changePercent: quote.dp,
            volume: null,
            timestamp: new Date(),
          },
        },
      },
      include: {
        cachedData: true,
        snapshots: true,
      },
    });

    return NextResponse.json(ticker, { status: 201 });
  } catch (error) {
    console.error('Error adding ticker:', error);
    return NextResponse.json(
      { error: 'Failed to add ticker' },
      { status: 500 }
    );
  }
}
