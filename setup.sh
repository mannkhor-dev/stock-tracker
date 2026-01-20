#!/bin/bash

# Stock Tracker Setup Script
# This script will initialize the Next.js project with all necessary dependencies

set -e

echo "🚀 Setting up Stock Ticker Tracker..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Initialize Next.js project
echo "📦 Creating Next.js application..."
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --use-npm

# Install additional dependencies
echo ""
echo "📦 Installing additional dependencies..."
npm install prisma @prisma/client
npm install @tanstack/react-query
npm install recharts
npm install axios
npm install date-fns
npm install clsx tailwind-merge

# Install dev dependencies
npm install -D @types/node

# Initialize Prisma
echo ""
echo "🗄️  Initializing Prisma..."
npx prisma init --datasource-provider sqlite

# Create Prisma schema
echo ""
echo "📝 Creating database schema..."
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Ticker {
  id            Int       @id @default(autoincrement())
  symbol        String    @unique
  exchange      String?
  companyName   String?
  addedAt       DateTime  @default(now())
  notes         String?
  snapshots     PriceSnapshot[]
  cachedData    CachedStockData[]
}

model PriceSnapshot {
  id            Int       @id @default(autoincrement())
  tickerId      Int
  price         Float
  changePercent Float?
  volume        Int?
  timestamp     DateTime  @default(now())
  ticker        Ticker    @relation(fields: [tickerId], references: [id], onDelete: Cascade)

  @@index([tickerId, timestamp])
}

model CachedStockData {
  id            Int       @id @default(autoincrement())
  tickerId      Int
  data          String    // JSON string
  cachedAt      DateTime  @default(now())
  expiresAt     DateTime
  ticker        Ticker    @relation(fields: [tickerId], references: [id], onDelete: Cascade)

  @@index([tickerId])
}
EOF

# Create .env.example
echo ""
echo "📝 Creating .env.example..."
cat > .env.example << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# Finnhub API (get free key at https://finnhub.io/)
FINNHUB_API_KEY="your_api_key_here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    echo "⚠️  Remember to add your Finnhub API key to .env.local"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create database
echo ""
echo "🗄️  Creating database..."
npx prisma migrate dev --name init

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get a free Finnhub API key at https://finnhub.io/"
echo "2. Add your API key to .env.local"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For the full implementation plan, see PROJECT_PLAN.md"
echo ""
