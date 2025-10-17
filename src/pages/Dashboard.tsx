
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Brain, 
  AlertTriangle, 
  DollarSign,
  Activity,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Sidebar from '@/components/Sidebar';
import MarketOverview from '@/components/MarketOverview';
import AnomalyAlerts from '@/components/AnomalyAlerts';
import PredictiveInsights from '@/components/PredictiveInsights';

const Dashboard = () => {
  const [spxPrice, setSpxPrice] = useState(4782.35);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Mock real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSpxPrice(prev => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(4700, Math.min(4850, prev + change));
      });
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const spxChange = 23.45;
  const spxChangePercent = 0.49;

  const performanceData = [
    { time: '09:30', price: 4758.90, volume: 12500 },
    { time: '10:00', price: 4762.15, volume: 15200 },
    { time: '10:30', price: 4759.80, volume: 11800 },
    { time: '11:00', price: 4765.40, volume: 16700 },
    { time: '11:30', price: 4771.20, volume: 13900 },
    { time: '12:00', price: 4768.95, volume: 14600 },
    { time: '12:30', price: 4775.60, volume: 17200 },
    { time: '13:00', price: 4782.35, volume: 19500 }
  ];

  const aiMetrics = [
    { 
      title: "Prediction Confidence", 
      value: 87.3, 
      icon: <Brain className="h-5 w-5 text-blue-500" />,
      trend: "+2.1%"
    },
    { 
      title: "Signal Strength", 
      value: 92.7, 
      icon: <Target className="h-5 w-5 text-green-500" />,
      trend: "+0.8%"
    },
    { 
      title: "Anomaly Score", 
      value: 15.4, 
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      trend: "-3.2%"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AI QUANT Dashboard</h1>
            <p className="text-slate-400">Real-time analytics and AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Last Update</div>
              <div className="text-white font-mono text-sm">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            {/* SPX Overview */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  S&P 500 Index (SPX)
                </CardTitle>
                <CardDescription>Real-time market data from IBKR and S&P feeds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-4xl font-bold text-white">
                        ${spxPrice.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {spxChange >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={spxChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {spxChange >= 0 ? "+" : ""}{spxChange.toFixed(2)} ({spxChangePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-500/20 text-green-400">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                      Live
                    </Badge>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        fill="url(#colorGradient)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiMetrics.map((metric, index) => (
                <Card key={index} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {metric.icon}
                        <span className="font-medium text-white">{metric.title}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-xs">
                        {metric.trend}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <MarketOverview />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PredictiveInsights />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AnomalyAlerts />
          </TabsContent>

          <TabsContent value="options" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">SPX Options Analytics</CardTitle>
                <CardDescription>Real-time options data and AI-powered analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-4" />
                  <p>Options analytics interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
