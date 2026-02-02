import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketDataItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

interface MarketData {
  indices: MarketDataItem[];
  forex: MarketDataItem[];
  crypto: MarketDataItem[];
  lastUpdated: number;
}

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch market data from backend
  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await window.ezsite.apis.run({
        path: 'polygonMarketDataFetcher',
        methodName: 'getMarketOverviewData',
        param: []
      });

      if (apiError) {
        throw new Error(apiError);
      }

      setMarketData(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch market data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Render individual market item card
  const renderMarketItem = (item: MarketDataItem, index: number) => {
    const isPositive = item.change >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    const bgColorClass = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';

    return (
      <motion.div
        key={item.symbol}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}>

        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with Symbol and Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{item.symbol}</h3>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
                  Live
                </Badge>
              </div>

              {/* Price */}
              <motion.div
                className="text-2xl font-bold text-white"
                key={item.price}
                initial={{ scale: 1.1, color: isPositive ? '#22c55e' : '#ef4444' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.5 }}>

                ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.div>

              {/* Change and Percent */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 ${colorClass}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="font-semibold">
                    {isPositive ? '+' : ''}{item.change.toFixed(2)}
                  </span>
                </div>
                <div className={`${colorClass} font-medium px-2 py-1 rounded ${bgColorClass}`}>
                  {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* Last Update */}
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Updated: {formatTime(item.timestamp)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>);

  };

  // Loading state
  if (loading && !marketData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Market Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) =>
          <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="space-y-3 animate-pulse">
                  <div className="h-5 bg-slate-700 rounded w-20"></div>
                  <div className="h-8 bg-slate-700 rounded w-32"></div>
                  <div className="h-4 bg-slate-700 rounded w-24"></div>
                  <div className="h-3 bg-slate-700 rounded w-28"></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>);

  }

  // Error state
  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Unable to load market data</p>
            <p className="text-sm text-slate-400 mt-2">{error}</p>
          </div>
          <Button onClick={fetchMarketData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            Market Overview
          </h2>
          {lastUpdate &&
          <p className="text-sm text-slate-400 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
            </p>
          }
        </div>
        <Button
          onClick={fetchMarketData}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-slate-600 hover:bg-slate-700">

          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stock Indices */}
      {marketData?.indices && marketData.indices.length > 0 &&
      <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Stock Indices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketData.indices.map((item, index) => renderMarketItem(item, index))}
          </div>
        </div>
      }

      {/* Forex */}
      {marketData?.forex && marketData.forex.length > 0 &&
      <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Forex</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.forex.map((item, index) => renderMarketItem(item, index))}
          </div>
        </div>
      }

      {/* Crypto */}
      {marketData?.crypto && marketData.crypto.length > 0 &&
      <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Crypto</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketData.crypto.map((item, index) => renderMarketItem(item, index))}
          </div>
        </div>
      }
    </div>);

};

export default MarketOverview;