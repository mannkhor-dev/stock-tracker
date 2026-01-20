'use client';

import { useState, useEffect } from 'react';
import { TickerCard } from '@/components/dashboard/TickerCard';
import { AddTickerForm } from '@/components/forms/AddTickerForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { RefreshCw, Search, Trash2 } from 'lucide-react';
import { getRelativeTime } from '@/lib/utils';

interface DashboardTicker {
  id: number;
  symbol: string;
  displaySymbol: string;
  exchange: string;
  companyName: string;
  currentPrice: number;
  changePercent: number;
  performance: {
    '1d': number | null;
    '7d': number | null;
    '30d': number | null;
  };
  lastUpdated: string;
  notes: string | null;
}

export default function DashboardPage() {
  const [tickers, setTickers] = useState<DashboardTicker[]>([]);
  const [filteredTickers, setFilteredTickers] = useState<DashboardTicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTickers = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch tickers');
      const data = await response.json();
      setTickers(data);
      setFilteredTickers(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching tickers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/tickers/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh tickers');
      }

      // Fetch updated data
      await fetchTickers();
    } catch (error) {
      console.error('Error refreshing tickers:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this ticker from your watchlist?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/tickers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticker');
      }

      // Remove from local state
      setTickers((prev) => prev.filter((t) => t.id !== id));
      setFilteredTickers((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting ticker:', error);
      alert('Failed to delete ticker');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchTickers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTickers(tickers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = tickers.filter(
      (ticker) =>
        ticker.displaySymbol.toLowerCase().includes(query) ||
        ticker.companyName.toLowerCase().includes(query) ||
        ticker.symbol.toLowerCase().includes(query)
    );
    setFilteredTickers(filtered);
  }, [searchQuery, tickers]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Watchlist</h1>
        <p className="text-muted-foreground">
          Track your favorite stocks with real-time data and performance metrics
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <AddTickerForm onSuccess={fetchTickers} />

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || tickers.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastRefresh && tickers.length > 0 && (
        <div className="text-sm text-muted-foreground mb-4">
          Last updated: {getRelativeTime(lastRefresh)}
        </div>
      )}

      {/* Empty State */}
      {tickers.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tickers in your watchlist</h3>
          <p className="text-muted-foreground mb-6">
            Add your first stock to start tracking performance
          </p>
          <AddTickerForm onSuccess={fetchTickers} />
        </div>
      )}

      {/* No Results */}
      {tickers.length > 0 && filteredTickers.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query
          </p>
        </div>
      )}

      {/* Ticker Grid */}
      {filteredTickers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTickers.map((ticker) => (
            <div key={ticker.id} className="relative group">
              <TickerCard {...ticker} />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(ticker.id);
                }}
                disabled={deletingId === ticker.id}
                className="absolute top-2 right-2 p-2 rounded-md bg-card/95 border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                title="Remove ticker"
              >
                {deletingId === ticker.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
