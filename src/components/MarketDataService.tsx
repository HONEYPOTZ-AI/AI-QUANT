import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  };
}

interface MarketDataState {
  data: Record<string, MarketData>;
  isConnected: boolean;
  lastUpdate: string;
  marketSummary: any;
  correlations: any;
}

interface MarketDataContextType extends MarketDataState {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  getPrice: (symbol: string) => number | null;
  refreshData: () => void;
}

const MarketDataContext = createContext<MarketDataContextType | null>(null);

// Mock data generator for demonstration
const generateMockData = (symbol: string): MarketData => {
  const basePrice = Math.random() * 1000 + 50;
  const change = (Math.random() - 0.5) * 20;
  const changePercent = change / basePrice * 100;

  return {
    symbol,
    price: Number(basePrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 1000000),
    high: Number((basePrice + Math.abs(change) * 1.2).toFixed(2)),
    low: Number((basePrice - Math.abs(change) * 1.2).toFixed(2)),
    open: Number((basePrice - change).toFixed(2)),
    timestamp: new Date().toISOString()
  };
};

export function MarketDataProvider({ children }: {children: ReactNode;}) {
  const [state, setState] = useState<MarketDataState>({
    data: {},
    isConnected: false,
    lastUpdate: ''
  });
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  // Simulate connection and data updates
  useEffect(() => {
    setState((prev) => ({ ...prev, isConnected: true }));

    const interval = setInterval(() => {
      if (subscriptions.size > 0) {
        const newData: Record<string, MarketData> = {};

        subscriptions.forEach((symbol) => {
          newData[symbol] = generateMockData(symbol);
        });

        setState((prev) => ({
          ...prev,
          data: { ...prev.data, ...newData },
          lastUpdate: new Date().toISOString()
        }));
      }
    }, 2000); // Update every 2 seconds

    return () => {
      clearInterval(interval);
      setState((prev) => ({ ...prev, isConnected: false }));
    };
  }, [subscriptions]);

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
    return state.data[symbol]?.price || null;
  };

  const value: MarketDataContextType = {
    ...state,
    subscribe,
    unsubscribe,
    getPrice
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