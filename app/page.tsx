import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Track Your Stocks with Confidence
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Monitor Australian and international stocks with real-time data, performance metrics, and direct links to the best brokers.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8">
              Go to Dashboard
              <TrendingUp className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Data</h3>
            <p className="text-muted-foreground">
              Get live stock quotes and price changes powered by Finnhub API
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
            <p className="text-muted-foreground">
              Monitor 1-day, 7-day, and 30-day performance metrics at a glance
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Broker Integration</h3>
            <p className="text-muted-foreground">
              Direct links to Australia's cheapest brokers - MooMoo, CMC, and more
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-lg border bg-card">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Add your first ticker and start tracking your investments
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
