import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import { useMarketData } from '@/components/MarketDataService';

interface RealTimeChartProps {
  symbol: string;
  height?: number;
}

export default function RealTimeChart({ symbol, height = 300 }: RealTimeChartProps) {
  const { data, isConnected, subscribe, unsubscribe } = useMarketData();
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('1m');

  const marketData = data[symbol];

  useEffect(() => {
    subscribe([symbol]);
    return () => unsubscribe([symbol]);
  }, [symbol, subscribe, unsubscribe]);

  // Update chart data when market data changes
  useEffect(() => {
    if (marketData) {
      const timestamp = new Date().toLocaleTimeString();
      setChartData(prev => {
        const newData = [...prev, { time: timestamp, price: marketData.price }];
        // Keep only last 50 data points
        return newData.slice(-50);
      });
    }
  }, [marketData]);

  const isPositive = marketData?.change >= 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {symbol}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                  {isConnected ? "LIVE" : "DISCONNECTED"}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>Real-time market data</CardDescription>
          </div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {marketData && (
          <div className="flex items-center gap-4 pt-2">
            <div className="text-2xl font-bold">
              ${marketData.price.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">
                {isPositive ? '+' : ''}{marketData.change.toFixed(2)} 
                ({isPositive ? '+' : ''}{marketData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.split(' ')[1] || value}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                labelFormatter={(value) => `Time: ${value}`}
                formatter={(value) => [`$${value}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? "#16a34a" : "#dc2626"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: isPositive ? "#16a34a" : "#dc2626" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {marketData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-600">Open</div>
              <div className="font-medium">${marketData.open.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">High</div>
              <div className="font-medium text-green-600">${marketData.high.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Low</div>
              <div className="font-medium text-red-600">${marketData.low.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Volume</div>
              <div className="font-medium">{marketData.volume.toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}