import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type DataSource = 'mock' | 'ibrk' | 'auto';

interface MarketData {
  symbol: string;
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
  };
  volume: {
    current: number;
    average: number;
    ratio: number;
  };
  indicators: any;
  sentiment: {
    sentiment: string;
    score: number;
    confidence: number;
    factors: string[];
  };
  metadata: {
    marketHours: boolean;
    volatility: number;
    lastUpdate: number;
    dataAge: number;
    source?: string;
  };
}

interface MarketDataState {
  data: Record<string, MarketData>;
  isConnected: boolean;
  lastUpdate: string;
  marketSummary: any;
  correlations: any;
  dataSource: DataSource;
  loading: boolean;
}

interface MarketDataContextType extends MarketDataState {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  getPrice: (symbol: string) => number | null;
  refreshData: () => void;
  setDataSource: (source: DataSource) => void;
}

const MarketDataContext = createContext<MarketDataContextType | null>(null);

// Mock data generator for demonstration
const generateMockData = (symbol: string): MarketData => {
  const basePrices: Record<string, number> = {
    'US30': 42500,
    'AAPL': 175.0,
    'GOOGL': 140.0,
    'MSFT': 340.0,
    'TSLA': 250.0,
    'NVDA': 450.0
  };

  const basePrice = basePrices[symbol] || Math.random() * 1000 + 50;
  const change = (Math.random() - 0.5) * basePrice * 0.02;
  const changePercent = change / basePrice * 100;

  return {
    symbol,
    price: {
      current: Number(basePrice.toFixed(2)),
      open: Number((basePrice - change).toFixed(2)),
      high: Number((basePrice + Math.abs(change) * 1.2).toFixed(2)),
      low: Number((basePrice - Math.abs(change) * 1.2).toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2))
    },
    volume: {
      current: Math.floor(Math.random() * 1000000 + 100000),
      average: 800000,
      ratio: 1.2
    },
    indicators: {
      rsi: 30 + Math.random() * 40,
      macd: (Math.random() - 0.5) * 2,
      bollingerBands: { upper: basePrice * 1.02, middle: basePrice, lower: basePrice * 0.98 },
      movingAverages: {
        sma20: basePrice * 0.99,
        sma50: basePrice * 0.98,
        ema12: basePrice * 0.995,
        ema26: basePrice * 0.99
      }
    },
    sentiment: {
      sentiment: changePercent > 0.5 ? 'bullish' : changePercent < -0.5 ? 'bearish' : 'neutral',
      score: 50 + changePercent * 10,
      confidence: 70,
      factors: ['Mock data indicator']
    },
    metadata: {
      marketHours: true,
      volatility: Math.abs(changePercent),
      lastUpdate: Date.now(),
      dataAge: 0,
      source: 'mock'
    }
  };
};

export function MarketDataProvider({ children }: {children: ReactNode;}) {
  const [state, setState] = useState<MarketDataState>({
    data: {},
    isConnected: false,
    lastUpdate: '',
    marketSummary: null,
    correlations: null,
    dataSource: 'mock',
    loading: false
  });
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  // Fetch data from selected source
  const fetchData = async (source: DataSource, symbols: string[]) => {
    if (symbols.length === 0) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      let result;

      if (source === 'ibrk') {
        // Fetch from IBRK
        const response = await window.ezsite.apis.run({ path: 'ibrkMarketDataFetcher', param: [symbols, null] });
        if (response.error) throw new Error(response.error);
        result = response.data;
      } else if (source === 'auto') {
        // Try IBRK first, fallback to mock
        try {
          const response = await window.ezsite.apis.run({ path: 'ibrkMarketDataFetcher', param: [symbols, null] });
          if (response.error) throw new Error(response.error);
          result = response.data;
        } catch (err) {
          console.warn('IBRK failed, falling back to mock data:', err);
          result = await fetchMockData(symbols);
        }
      } else {
        // Use mock data
        result = await fetchMockData(symbols);
      }

      setState((prev) => ({
        ...prev,
        data: result.data || {},
        marketSummary: result.summary || null,
        correlations: result.correlations || null,
        lastUpdate: result.metadata?.fetchTime || new Date().toISOString(),
        isConnected: true,
        loading: false
      }));

    } catch (err: any) {
      console.error('Failed to fetch market data:', err);
      // Fallback to mock on error
      const mockResult = await fetchMockData(symbols);
      setState((prev) => ({
        ...prev,
        data: mockResult.data || {},
        marketSummary: mockResult.summary || null,
        correlations: mockResult.correlations || null,
        lastUpdate: new Date().toISOString(),
        isConnected: true,
        loading: false
      }));
    }
  };

  const fetchMockData = async (symbols: string[]) => {
    const data: Record<string, MarketData> = {};
    symbols.forEach((symbol) => {
      data[symbol] = generateMockData(symbol);
    });

    return {
      data,
      summary: {
        totalSymbols: symbols.length,
        marketTrend: 'neutral',
        averageChange: 0,
        totalVolume: Object.values(data).reduce((sum, d) => sum + d.volume.current, 0)
      },
      correlations: {},
      metadata: {
        fetchTime: new Date().toISOString(),
        source: 'mock'
      }
    };
  };

  // Update data based on subscriptions and source
  useEffect(() => {
    if (subscriptions.size === 0) {
      setState((prev) => ({ ...prev, isConnected: false }));
      return;
    }

    setState((prev) => ({ ...prev, isConnected: true }));

    const symbols = Array.from(subscriptions);
    const source = state.dataSource;

    // Fetch immediately
    fetchData(source, symbols);

    // Set up periodic updates
    const interval = setInterval(() => {
      fetchData(source, symbols);
    }, source === 'mock' ? 2000 : 5000); // Mock: 2s, IBRK: 5s

    return () => {
      clearInterval(interval);
      setState((prev) => ({ ...prev, isConnected: false }));
    };
  }, [subscriptions]); // Removed state.dataSource from dependencies to prevent infinite loop

  const subscribe = (symbols: string[]) => {
    setSubscriptions((prev) => {
      const newSet = new Set(prev);
      symbols.forEach((symbol) => newSet.add(symbol));
      return newSet;
    });
  };

  const unsubscribe = (symbols: string[]) => {
    setSubscriptions((prev) => {
      const newSet = new Set(prev);
      symbols.forEach((symbol) => newSet.delete(symbol));
      return newSet;
    });
  };

  const getPrice = (symbol: string): number | null => {
    return state.data[symbol]?.price.current || null;
  };

  const refreshData = () => {
    if (subscriptions.size > 0) {
      fetchData(state.dataSource, Array.from(subscriptions));
    }
  };

  const setDataSource = (source: DataSource) => {
    setState((prev) => ({ ...prev, dataSource: source }));
    // Trigger immediate refresh with new data source
    if (subscriptions.size > 0) {
      fetchData(source, Array.from(subscriptions));
    }
  };

  const value: MarketDataContextType = {
    ...state,
    subscribe,
    unsubscribe,
    getPrice,
    refreshData,
    setDataSource
  };

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>);

}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (!context) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}

// API Integration Service (ready for real backend)
export class MarketDataAPI {
  private static instance: MarketDataAPI;
  private baseURL = '/api/market-data'; // Will be replaced with actual FastAPI endpoint

  static getInstance(): MarketDataAPI {
    if (!MarketDataAPI.instance) {
      MarketDataAPI.instance = new MarketDataAPI();
    }
    return MarketDataAPI.instance;
  }

  // IBKR API Integration (placeholder)
  async connectIBKR(credentials: {username: string;password: string;}) {
    // This will integrate with actual IBKR API
    console.log('Connecting to IBKR API...');
    try {
      // const response = await fetch(`${this.baseURL}/ibkr/connect`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(credentials)
      // });
      // return response.json();
      return { success: true, message: 'Connected to IBKR (mock)' };
    } catch (error) {
      console.error('IBKR connection error:', error);
      throw error;
    }
  }

  // S&P Global API Integration (placeholder)
  async connectSPGlobal(apiKey: string) {
    // This will integrate with actual S&P Global API
    console.log('Connecting to S&P Global API...');
    try {
      // const response = await fetch(`${this.baseURL}/spglobal/connect`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey }
      // });
      // return response.json();
      return { success: true, message: 'Connected to S&P Global (mock)' };
    } catch (error) {
      console.error('S&P Global connection error:', error);
      throw error;
    }
  }

  // Real-time data subscription
  async subscribeToSymbols(symbols: string[]) {
    console.log('Subscribing to symbols:', symbols);
    // This will use WebSocket connection to FastAPI backend
    return { success: true, subscribed: symbols };
  }

  // Get historical data
  async getHistoricalData(symbol: string, timeframe: string) {
    console.log(`Getting historical data for ${symbol} (${timeframe})`);
    // This will call FastAPI backend for historical data
    return { symbol, data: [], timeframe };
  }
}