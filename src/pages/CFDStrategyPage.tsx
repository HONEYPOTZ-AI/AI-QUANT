import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import CFDStrategyChart from '@/components/CFDStrategyChart';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Database } from
'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMarketData, type DataSource } from '@/components/MarketDataService';

interface Signal {
  timestamp: string;
  type: 'long' | 'short';
  price: number;
  rsi: number;
  macd: number;
  volume: number;
  commentary: string;
}

interface MarketData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function CFDStrategyPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealData, setUseRealData] = useState(false);
  const { toast } = useToast();
  const { data: liveMarketData, dataSource, setDataSource, subscribe, unsubscribe } = useMarketData();

  // Subscribe to US30 for live data
  useEffect(() => {
    subscribe(['US30']);
    return () => {
      unsubscribe(['US30']);
    };
  }, []);

  // Generate realistic US30 market data or use live data
  const generateMarketData = (bars = 100): MarketData[] => {
    // If using real data and we have it, build historical from current price
    if (useRealData && liveMarketData['US30']) {
      const currentPrice = liveMarketData['US30'].price.current;
      const data: MarketData[] = [];
      const now = Date.now();
      let price = currentPrice * 0.98; // Start slightly lower

      for (let i = bars; i >= 0; i--) {
        const timestamp = new Date(now - i * 5 * 60 * 1000).toISOString();
        const open = price;
        const volatility = 30 + Math.random() * 40;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = i === 0 ? currentPrice : (low + Math.random() * (high - low));
        const volume = Math.floor(5000 + Math.random() * 15000);

        data.push({
          timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });

        const trend = close > open ? 1 : -1;
        price = close + Math.random() * 20 * trend;
      }

      return data;
    }

    // Otherwise use generated data
    const data: MarketData[] = [];
    let currentPrice = 42500;
    const now = Date.now();

    for (let i = bars; i >= 0; i--) {
      const timestamp = new Date(now - i * 5 * 60 * 1000).toISOString();
      const open = currentPrice;
      const volatility = 50 + Math.random() * 50;
      const high = open + Math.random() * volatility;
      const low = open - Math.random() * volatility;
      const close = low + Math.random() * (high - low);
      const volume = Math.floor(5000 + Math.random() * 15000);

      data.push({
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });

      const trend = Math.random() > 0.5 ? 1 : -1;
      currentPrice = close + Math.random() * 20 * trend;
    }

    return data;
  };

  const fetchDataAndSignals = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate market data
      const data = generateMarketData(100);
      setMarketData(data);

      // Call the CFD strategy engine
      const result = await window.ezsite.nodejs.cfdStrategyEngine(data);

      if (result.error) {
        throw new Error(result.error);
      }

      setSignals(result.data || []);

      toast({
        title: 'Strategy Analysis Complete',
        description: `Generated ${result.data?.length || 0} trading signals`
      });

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch strategy data';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataAndSignals();
  }, []);

  const longSignals = signals.filter((s) => s.type === 'long').length;
  const shortSignals = signals.filter((s) => s.type === 'short').length;
  const totalSignals = signals.length;
  const longShortRatio = shortSignals > 0 ? (longSignals / shortSignals).toFixed(2) : 'N/A';

  const lastSignal = signals.length > 0 ? signals[signals.length - 1] : null;
  const strategyStatus = lastSignal ? lastSignal.type : 'neutral';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-7 h-7 text-blue-400" />
                  US30 CFD Trading Strategy
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  AI-powered momentum breakout and reversal detection
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Activity className="w-3 h-3 mr-1" />
                Live Strategy
              </Badge>
              <Select value={useRealData ? 'live' : 'generated'} onValueChange={(v) => setUseRealData(v === 'live')}>
                <SelectTrigger className="w-[140px] bg-slate-700 border-slate-600 text-sm">
                  <Database className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="live">Live ({dataSource === 'ibrk' ? 'IBRK' : dataSource === 'auto' ? 'Auto' : 'Mock'})</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchDataAndSignals}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700">

                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Total Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalSignals}</div>
              <p className="text-xs text-slate-500 mt-1">In current dataset</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-green-400" />
                Long Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">{longSignals}</div>
              <p className="text-xs text-slate-500 mt-1">
                {totalSignals > 0 ? `${(longSignals / totalSignals * 100).toFixed(1)}% of total` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-red-400" />
                Short Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">{shortSignals}</div>
              <p className="text-xs text-slate-500 mt-1">
                {totalSignals > 0 ? `${(shortSignals / totalSignals * 100).toFixed(1)}% of total` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Strategy Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {strategyStatus === 'long' &&
                <>
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <span className="text-2xl font-bold text-green-400">LONG</span>
                  </>
                }
                {strategyStatus === 'short' &&
                <>
                    <TrendingDown className="w-6 h-6 text-red-400" />
                    <span className="text-2xl font-bold text-red-400">SHORT</span>
                  </>
                }
                {strategyStatus === 'neutral' &&
                <>
                    <Activity className="w-6 h-6 text-slate-400" />
                    <span className="text-2xl font-bold text-slate-400">NEUTRAL</span>
                  </>
                }
              </div>
              <p className="text-xs text-slate-500 mt-1">
                L/S Ratio: {longShortRatio}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error &&
        <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        {/* Chart Section */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              US30 Candlestick Chart with Trade Signals
            </CardTitle>
            <CardDescription className="text-slate-400">
              5-minute timeframe with momentum breakout and reversal signals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ?
            <div className="space-y-3">
                <Skeleton className="h-[500px] w-full bg-slate-700/50" />
              </div> :
            marketData.length > 0 ?
            <CFDStrategyChart data={marketData} signals={signals} height={500} /> :

            <div className="h-[500px] flex items-center justify-center text-slate-400">
                No market data available
              </div>
            }
          </CardContent>
        </Card>

        {/* Signal Details */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Signal History</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed breakdown of all trading signals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ?
            <div className="space-y-3">
                {[1, 2, 3].map((i) =>
              <Skeleton key={i} className="h-20 w-full bg-slate-700/50" />
              )}
              </div> :
            signals.length > 0 ?
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {signals.map((signal, idx) =>
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                signal.type === 'long' ?
                'bg-green-900/10 border-green-900/30' :
                'bg-red-900/10 border-red-900/30'}`
                }>

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {signal.type === 'long' ?
                    <TrendingUp className="w-5 h-5 text-green-400" /> :

                    <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                        <span className={`font-bold uppercase ${
                    signal.type === 'long' ? 'text-green-400' : 'text-red-400'}`
                    }>
                          {signal.type} Signal
                        </span>
                      </div>
                      <span className="text-sm text-slate-400">
                        {new Date(signal.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-2 text-sm">
                      <div>
                        <span className="text-slate-400">Price:</span>
                        <span className="text-white font-medium ml-2">${signal.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">RSI:</span>
                        <span className="text-blue-400 font-medium ml-2">{signal.rsi}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">MACD:</span>
                        <span className="text-purple-400 font-medium ml-2">{signal.macd.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Volume:</span>
                        <span className="text-white font-medium ml-2">{signal.volume.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 italic">{signal.commentary}</p>
                  </div>
              )}
              </div> :

            <div className="text-center py-12 text-slate-400">
                No trading signals generated for current dataset
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>);

}