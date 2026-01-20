'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { Plus, X } from 'lucide-react';

interface AddTickerFormProps {
  onSuccess?: () => void;
}

export function AddTickerForm({ onSuccess }: AddTickerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/tickers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add ticker');
      }

      setSuccess(`Added ${data.displaySymbol} (${data.companyName}) to your watchlist!`);
      setSymbol('');
      setNotes('');

      // Call onSuccess callback after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ticker');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} size="lg">
        <Plus className="h-5 w-5 mr-2" />
        Add Ticker
      </Button>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add New Ticker</h3>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(null);
              setSymbol('');
              setNotes('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label htmlFor="symbol" className="text-sm font-medium">
            Stock Symbol
          </label>
          <Input
            id="symbol"
            type="text"
            placeholder="e.g., CBA, AAPL, TSLA"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={loading}
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Enter the stock symbol. We'll auto-detect the exchange (ASX or US markets).
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes (Optional)
          </label>
          <Input
            id="notes"
            type="text"
            placeholder="e.g., Long-term hold, Watch for earnings"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-success bg-success/10 border border-success/20 rounded-md">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !symbol.trim()} className="flex-1">
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              'Add Ticker'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setSuccess(null);
              setSymbol('');
              setNotes('');
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
