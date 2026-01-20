import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/tickers/:id
 * Remove a ticker from watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ticker ID' },
        { status: 400 }
      );
    }

    // Check if ticker exists
    const ticker = await prisma.ticker.findUnique({
      where: { id },
    });

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }

    // Delete ticker (cascades to snapshots and cached data)
    await prisma.ticker.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticker:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticker' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tickers/:id
 * Update ticker notes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ticker ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    // Update ticker
    const ticker = await prisma.ticker.update({
      where: { id },
      data: { notes },
      include: {
        cachedData: true,
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(ticker);
  } catch (error) {
    console.error('Error updating ticker:', error);
    return NextResponse.json(
      { error: 'Failed to update ticker' },
      { status: 500 }
    );
  }
}
