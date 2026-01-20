'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TickerCardProps {
  id: number;
  symbol: string;
  displaySymbol: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  performance: {
    '1d': number | null;
    '7d': number | null;
    '30d': number | null;
  };
  exchange: string;
}

export function TickerCard({
  id,
  symbol,
  displaySymbol,
  companyName,
  currentPrice,
  changePercent,
  performance,
  exchange,
}: TickerCardProps) {
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;

  return (
    <Link href={`/ticker/${encodeURIComponent(symbol)}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{displaySymbol}</CardTitle>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {companyName}
              </p>
            </div>
            <Badge variant="outline" className="ml-2 shrink-0">
              {exchange}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Current Price and Change */}
          <div>
            <div className="text-2xl font-bold">
              {formatCurrency(currentPrice)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isPositive && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5 text-danger" />}
              {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span
                className={`text-sm font-medium ${
                  isPositive
                    ? 'text-success'
                    : isNegative
                    ? 'text-danger'
                    : 'text-muted-foreground'
                }`}
              >
                {formatPercent(changePercent)}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground mb-1">1D</div>
              <div
                className={`text-sm font-medium ${
                  performance['1d'] !== null
                    ? performance['1d']! > 0
                      ? 'text-success'
                      : performance['1d']! < 0
                      ? 'text-danger'
                      : 'text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {performance['1d'] !== null ? formatPercent(performance['1d']!) : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">7D</div>
              <div
                className={`text-sm font-medium ${
                  performance['7d'] !== null
                    ? performance['7d']! > 0
                      ? 'text-success'
                      : performance['7d']! < 0
                      ? 'text-danger'
                      : 'text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {performance['7d'] !== null ? formatPercent(performance['7d']!) : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">30D</div>
              <div
                className={`text-sm font-medium ${
                  performance['30d'] !== null
                    ? performance['30d']! > 0
                      ? 'text-success'
                      : performance['30d']! < 0
                      ? 'text-danger'
                      : 'text-muted-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {performance['30d'] !== null ? formatPercent(performance['30d']!) : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
