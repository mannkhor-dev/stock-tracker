import axios, { AxiosError } from 'axios';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 4,
  initialDelay: 2000, // 2 seconds
};

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx), only on network/server errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error; // Don't retry client errors except rate limits
        }
      }

      if (attempt < config.maxRetries) {
        const delay = config.initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Finnhub API client
 */
class FinnhubClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string = FINNHUB_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = FINNHUB_BASE_URL;
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    return retryWithBackoff(async () => {
      const response = await axios.get<T>(`${this.baseUrl}${endpoint}`, {
        params: {
          ...params,
          token: this.apiKey,
        },
        timeout: 10000, // 10 second timeout
      });

      return response.data;
    });
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<{
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High price of the day
    l: number; // Low price of the day
    o: number; // Open price of the day
    pc: number; // Previous close price
    t: number; // Timestamp
  } | null> {
    try {
      const data = await this.request<any>('/quote', { symbol });

      // Finnhub returns c: 0 for invalid symbols
      if (data.c === 0 && data.d === 0 && data.dp === 0) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get company profile
   */
  async getCompanyProfile(symbol: string): Promise<{
    name: string;
    ticker: string;
    exchange: string;
    ipo: string;
    marketCapitalization: number;
    shareOutstanding: number;
    logo: string;
    phone: string;
    weburl: string;
    finnhubIndustry: string;
  } | null> {
    try {
      const data = await this.request<any>('/stock/profile2', { symbol });

      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching company profile for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get basic financials (P/E ratio, 52-week high/low, etc.)
   */
  async getBasicFinancials(symbol: string): Promise<{
    metric: {
      '52WeekHigh': number;
      '52WeekLow': number;
      '52WeekLowDate': string;
      '52WeekHighDate': string;
      '52WeekPriceReturnDaily': number;
      'peBasicExclExtraTTM': number;
      'beta': number;
      'marketCapitalization': number;
    };
    series: any;
  } | null> {
    try {
      const data = await this.request<any>('/stock/metric', {
        symbol,
        metric: 'all',
      });

      if (!data || !data.metric) {
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching financials for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical candle data (OHLC)
   * @param resolution - Supported resolutions: 1, 5, 15, 30, 60, D, W, M
   * @param from - Unix timestamp
   * @param to - Unix timestamp
   */
  async getCandles(
    symbol: string,
    resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M',
    from: number,
    to: number
  ): Promise<{
    c: number[]; // Close prices
    h: number[]; // High prices
    l: number[]; // Low prices
    o: number[]; // Open prices
    s: string; // Status (ok, no_data, error)
    t: number[]; // Timestamps
    v: number[]; // Volume
  } | null> {
    try {
      const data = await this.request<any>('/stock/candle', {
        symbol,
        resolution,
        from,
        to,
      });

      if (data.s === 'no_data' || data.s === 'error') {
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error fetching candles for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Auto-detect exchange for a symbol
   * Tries ASX first (.AX suffix), then US markets
   */
  async autoDetectSymbol(symbol: string): Promise<{
    fullSymbol: string;
    displaySymbol: string;
    exchange: string;
    companyName: string;
  } | null> {
    // Clean up the symbol
    const cleanSymbol = symbol.trim().toUpperCase();

    // If it already has an exchange suffix, use it directly
    if (cleanSymbol.includes('.')) {
      const quote = await this.getQuote(cleanSymbol);
      if (quote) {
        const profile = await this.getCompanyProfile(cleanSymbol);
        return {
          fullSymbol: cleanSymbol,
          displaySymbol: cleanSymbol.split('.')[0],
          exchange: profile?.exchange || (cleanSymbol.includes('.AX') ? 'ASX' : 'Unknown'),
          companyName: profile?.name || cleanSymbol,
        };
      }
      return null;
    }

    // Try ASX first
    const asxSymbol = `${cleanSymbol}.AX`;
    const asxQuote = await this.getQuote(asxSymbol);

    if (asxQuote) {
      const profile = await this.getCompanyProfile(asxSymbol);
      return {
        fullSymbol: asxSymbol,
        displaySymbol: cleanSymbol,
        exchange: 'ASX',
        companyName: profile?.name || cleanSymbol,
      };
    }

    // Try US markets (no suffix needed)
    const usQuote = await this.getQuote(cleanSymbol);

    if (usQuote) {
      const profile = await this.getCompanyProfile(cleanSymbol);
      return {
        fullSymbol: cleanSymbol,
        displaySymbol: cleanSymbol,
        exchange: profile?.exchange || 'US',
        companyName: profile?.name || cleanSymbol,
      };
    }

    return null;
  }
}

export const finnhubClient = new FinnhubClient();
export default finnhubClient;
