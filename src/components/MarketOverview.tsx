
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Users, Database, RefreshCw } from 'lucide-react';
import { useMarketData, type DataSource } from './MarketDataService';

const MarketOverview = () => {
  const { marketSummary, data: marketData, loading, dataSource, setDataSource, refreshData } = useMarketData();

  if (loading || !marketSummary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
              <div className="h-6 bg-muted animate-pulse rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalVolume = marketSummary.totalVolume;
  const avgChange = marketSummary.averageChange;
  const marketMomentum = marketSummary.marketMomentum;
  const totalSymbols = marketSummary.totalSymbols;

  const marketStats = [
  {
    title: 'Market Trend',
    value: marketSummary.marketTrend.toUpperCase(),
    change: `${avgChange > 0 ? '+' : ''}${avgChange}%`,
    trend: avgChange > 0 ? 'up' : 'down',
    icon: avgChange > 0 ? TrendingUp : TrendingDown
  },
  {
    title: 'Active Symbols',
    value: totalSymbols.toString(),
    change: `${marketSummary.bullishStocks} bullish`,
    trend: marketSummary.bullishStocks > marketSummary.bearishStocks ? 'up' : 'down',
    icon: Users
  },
  {
    title: 'Total Volume',
    value: `${(totalVolume / 1000000).toFixed(1)}M`,
    change: `${marketSummary.bearishStocks} bearish`,
    trend: marketSummary.bearishStocks < marketSummary.bullishStocks ? 'up' : 'down',
    icon: BarChart3
  },
  {
    title: 'Market Momentum',
    value: `${marketMomentum > 0 ? '+' : ''}${marketMomentum}%`,
    change: marketSummary.neutralStocks > 0 ? `${marketSummary.neutralStocks} neutral` : 'Strong direction',
    trend: marketMomentum > 0 ? 'up' : 'down',
    icon: Activity
  }];

  const [localMarketData, setLocalMarketData] = useState([
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    price: 4782.35,
    change: 23.45,
    changePercent: 0.49,
    volume: '3.2B'
  },
  {
    symbol: 'VIX',
    name: 'CBOE Volatility Index',
    price: 16.78,
    change: -1.23,
    changePercent: -6.83,
    volume: '245M'
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    price: 478.92,
    change: 2.34,
    changePercent: 0.49,
    volume: '82.5M'
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    price: 398.45,
    change: 5.67,
    changePercent: 1.44,
    volume: '45.2M'
  }]
  );

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalMarketData((prevData) =>
      prevData.map((item) => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * 2,
        change: item.change + (Math.random() - 0.5) * 0.5
      }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sectorData = [
  { sector: 'Technology', performance: 2.34, weight: 28.7 },
  { sector: 'Healthcare', performance: 1.23, weight: 13.2 },
  { sector: 'Financial Services', performance: 0.89, weight: 11.1 },
  { sector: 'Consumer Discretionary', performance: -0.45, weight: 10.5 },
  { sector: 'Communication Services', performance: 1.78, weight: 8.9 }];


  return (
    <div className="space-y-6">
      {/* Data Source Selector */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Market Data Source
              </CardTitle>
              <CardDescription>Choose your real-time data provider</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dataSource} onValueChange={(value) => setDataSource(value as DataSource)}>
                <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock Data</SelectItem>
                  <SelectItem value="ibrk">IBRK Live</SelectItem>
                  <SelectItem value="auto">Auto (IBRK + Fallback)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={refreshData} size="sm" variant="outline" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Market Indices */
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Market Indices
          </CardTitle>
          <CardDescription>Real-time market data and indices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {localMarketData.map((item, index) => (
              <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{item.symbol}</span>
                  <Badge variant="outline" className="border-blue-500/20 text-blue-400 text-xs">
                    Live
                  </Badge>
                </div>
                <div className="text-sm text-slate-400 mb-3">{item.name}</div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    ${item.price.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {item.change >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={item.change >= 0 ? "text-green-500" : "text-red-500"}>
                        {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}
                      </span>
                    </div>
                    <span className={`text-sm ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ({item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Vol: {item.volume}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                  {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sector Performance */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Sector Performance
          </CardTitle>
          <CardDescription>S&P 500 sector breakdown and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectorData.map((sector, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium">{sector.sector}</div>
                  <Badge variant="secondary" className="text-xs">
                    {sector.weight}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {sector.performance >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-medium ${sector.performance >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {sector.performance >= 0 ? "+" : ""}{sector.performance.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketOverview;