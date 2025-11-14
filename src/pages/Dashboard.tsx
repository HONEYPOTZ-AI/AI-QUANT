
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
  RefreshCw,
  Settings,
  User,
  Database } from
'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import MarketOverview from '@/components/MarketOverview';
import AnomalyAlerts from '@/components/AnomalyAlerts';
import PredictiveInsights from '@/components/PredictiveInsights';
import RealTimeChart from '@/components/RealTimeChart';
import UserProfile from '@/components/UserProfile';
import ApiIntegration from '@/components/ApiIntegration';
import LoginForm from '@/components/LoginForm';
import FastAPIConfiguration from '@/components/FastAPIConfiguration';
import CTraderConfiguration from '@/components/CTraderConfiguration';
import ThinkorSwimConfiguration from '@/components/ThinkorSwimConfiguration';
import Walkthrough from '@/components/Walkthrough';
import SPXVIXDisplay from '@/components/SPXVIXDisplay';
import EconomicDataRefreshTrigger from '@/components/EconomicDataRefreshTrigger';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [runTour, setRunTour] = useState(false);

  // Check if this is the user's first visit
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour && user) {
      // Delay tour start to ensure DOM is ready
      const timer = setTimeout(() => {
        setRunTour(true);
        localStorage.setItem('hasSeenTour', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleStartTour = () => {
    setRunTour(true);
  };

  const handleCloseTour = () => {
    setRunTour(false);
  };

  const [spxPrice, setSpxPrice] = useState(4782.35);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Mock real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSpxPrice((prev) => {
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
  { time: '13:00', price: 4782.35, volume: 19500 }];


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
  }];


  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row" data-tour="dashboard-overview">
      <EconomicDataRefreshTrigger />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onStartTour={handleStartTour} />
      <Walkthrough run={runTour} onClose={handleCloseTour} />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AI QUANT Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-400">Real-time analytics and AI-powered insights</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <div className="text-sm text-slate-400">Last Update</div>
              <div className="text-white font-mono text-sm">
                {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600 w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            {/* SPX/VIX Display - Prominent Position */}
            <div className="mb-6">
              <SPXVIXDisplay />
            </div>

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
                        {spxChange >= 0 ?
                        <TrendingUp className="h-4 w-4 text-green-500" /> :

                        <TrendingDown className="h-4 w-4 text-red-500" />
                        }
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
                        }} />

                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        fill="url(#colorGradient)"
                        strokeWidth={2} />

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
              {aiMetrics.map((metric, index) =>
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
              )}
            </div>

            <div data-tour="market-overview">
              <MarketOverview />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div data-tour="predictive-insights">
              <PredictiveInsights />
            </div>

            {/* Portfolio Optimization Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Portfolio Analytics
                </CardTitle>
                <CardDescription>
                  AI-powered portfolio optimization and risk management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">87.3%</div>
                    <div className="text-sm text-muted-foreground">Optimization Score</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1.42</div>
                    <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">Medium</div>
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time portfolio analysis using advanced quantitative models. 
                  Access full optimization features in the Portfolio tab.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div data-tour="anomaly-alerts">
              <AnomalyAlerts />
            </div>
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

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ApiIntegration />
              <div data-tour="user-profile">
                <UserProfile />
              </div>
            </div>

            <div className="space-y-6" data-tour="fastapi-config">
              <FastAPIConfiguration />
              <CTraderConfiguration />
              <ThinkorSwimConfiguration />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>);

};

export default Dashboard;