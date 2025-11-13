import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import CFDStrategyChart from '@/components/CFDStrategyChart';
import VelocityStrategyConfig from '@/components/VelocityStrategyConfig';
import VelocityDashboard from '@/components/VelocityDashboard';
import AgentCommentaryFeed from '@/components/AgentCommentaryFeed';
import PositionStatus from '@/components/PositionStatus';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import PnLReport from '@/components/PnLReport';
import EquityTracker from '@/components/EquityTracker';
import {
  Target,
  RefreshCw,
  AlertCircle,
  PlayCircle,
  PauseCircle } from
'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CommentaryMessage {
  id: string;
  type: 'entry' | 'exit' | 'analysis' | 'risk';
  message: string;
  timestamp: string;
}

export default function CFDStrategyPage() {
  const [strategyEnabled, setStrategyEnabled] = useState(false);
  const [accountEquity, setAccountEquity] = useState(10000);
  const [velocityMultiplier, setVelocityMultiplier] = useState(2.5);
  const [volumeMultiplier, setVolumeMultiplier] = useState(1.5);
  const [rsiUpperThreshold, setRsiUpperThreshold] = useState(55);
  const [rsiLowerThreshold, setRsiLowerThreshold] = useState(45);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<CommentaryMessage[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>({});
  const [performanceMetrics, setPerformanceMetrics] = useState({
    winRate: 0,
    avgRiskReward: 1.5,
    totalTrades: 0,
    velocityAccuracy: { hits: 0, false: 0, accuracy: 0 }
  });

  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (strategyEnabled) {
      analyzeMarket();
      interval = setInterval(() => {
        analyzeMarket();
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [strategyEnabled, velocityMultiplier, volumeMultiplier, rsiUpperThreshold, rsiLowerThreshold]);

  const addCommentary = (type: 'entry' | 'exit' | 'analysis' | 'risk', message: string) => {
    const newMessage: CommentaryMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    setCommentary((prev) => [...prev, newMessage]);
  };

  const analyzeMarket = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = 1;

      const result = await (window as any).ezsite.apis.run({
        path: 'velocityRangeBreakoutStrategy',
        param: ['analyzeMarket', {
          userId,
          accountId: null
        }]
      });

      if (result.error) throw new Error(result.error);

      const analysis = result.analysis || {};

      setDashboardData({
        trendBias5m: analysis.trendBias5m,
        trendBias1h: analysis.trendBias1h,
        compressionDetected: analysis.compression?.compressed || false,
        compressionCount: analysis.compression?.compressionCount || 0,
        cdcVelocity: {
          current: parseFloat(analysis.velocity?.currentVelocity || 0),
          average: parseFloat(analysis.velocity?.avgVelocity || 0),
          ratio: parseFloat(analysis.velocity?.velocityRatio || 0)
        },
        volume: {
          current: 0,
          average: 0,
          ratio: parseFloat(analysis.velocity?.volumeRatio || 0)
        },
        activeSignals: result.signal ? [{
          type: result.signal,
          price: analysis.currentPrice,
          timestamp: result.timestamp
        }] : [],
        currentPrice: analysis.currentPrice,
        rsi: parseFloat(analysis.rsi || 50)
      });

      if (result.commentary && Array.isArray(result.commentary)) {
        result.commentary.forEach((msg: string) => {
          if (msg.includes('🔥') || msg.includes('✅')) {
            addCommentary('entry', msg);
          } else if (msg.includes('⚠️') || msg.includes('🛑')) {
            addCommentary('risk', msg);
          } else {
            addCommentary('analysis', msg);
          }
        });
      }

      if (result.signal && strategyEnabled) {
        toast({
          title: `${result.signal.toUpperCase()} Signal Detected`,
          description: `Strategy analyzing breakout at ${analysis.currentPrice}`
        });

        if (accountEquity > 0) {
          await executeTrade(result.signal, analysis);
        }
      }

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze market';
      setError(errorMsg);
      addCommentary('risk', `Error: ${errorMsg}`);
      toast({
        title: 'Analysis Error',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeTrade = async (signal: string, analysisData: any) => {
    try {
      addCommentary('analysis', `Preparing to execute ${signal.toUpperCase()} trade...`);

      const result = await (window as any).ezsite.apis.run({
        path: 'velocityRangeBreakoutStrategy',
        param: ['executeTrade', {
          userId: 1,
          accountId: null,
          signal,
          analysisData: {
            currentCandle: {
              low: analysisData.currentPrice - 10,
              high: analysisData.currentPrice + 10
            },
            structure: {
              ema9_5m: [analysisData.currentPrice],
              currentIndex: 0
            }
          }
        }]
      });

      if (result.error) throw new Error(result.error);

      const newPosition = {
        id: result.orderId || Date.now().toString(),
        side: signal as 'long' | 'short',
        entryPrice: result.entry.price,
        currentPrice: result.entry.price,
        stopLoss: result.risk.stopLoss,
        takeProfit: result.risk.takeProfit1,
        lotSize: result.entry.lotSize,
        pnlPoints: 0,
        pnlPercent: 0,
        pnlAmount: 0
      };

      setPositions((prev) => [...prev, newPosition]);

      if (result.commentary && Array.isArray(result.commentary)) {
        result.commentary.forEach((msg: string) => {
          addCommentary('entry', msg);
        });
      }

      setPerformanceMetrics((prev) => ({
        ...prev,
        totalTrades: prev.totalTrades + 1
      }));

      toast({
        title: 'Trade Executed',
        description: `${signal.toUpperCase()} position opened at ${result.entry.price.toFixed(2)}`
      });

    } catch (err: any) {
      addCommentary('risk', `Trade execution failed: ${err.message}`);
      toast({
        title: 'Execution Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const toggleStrategy = (enabled: boolean) => {
    setStrategyEnabled(enabled);
    if (enabled) {
      addCommentary('analysis', '🟢 Strategy activated - Monitoring for velocity breakout signals');
      toast({
        title: 'Strategy Enabled',
        description: 'Velocity-Triggered Range Breakout strategy is now active'
      });
    } else {
      addCommentary('analysis', '🔴 Strategy deactivated - No new positions will be opened');
      toast({
        title: 'Strategy Disabled',
        description: 'Strategy monitoring paused'
      });
    }
  };

  const totalRiskUsed = positions.reduce((sum, pos) => {
    const riskPercent = Math.abs(pos.entryPrice - pos.stopLoss) * pos.lotSize / accountEquity * 100;
    return sum + riskPercent;
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                  Velocity-Triggered Range Breakout
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  CDC Velocity × Range Compression Strategy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => toggleStrategy(!strategyEnabled)}
                className={strategyEnabled ?
                'bg-red-600 hover:bg-red-700' :
                'bg-green-600 hover:bg-green-700'
                }>

                {strategyEnabled ?
                <>
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Stop Strategy
                  </> :

                <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Strategy
                  </>
                }
              </Button>
              <Button
                onClick={analyzeMarket}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-slate-600">

                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error &&
        <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-900/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="pnl">P&L</TabsTrigger>
                <TabsTrigger value="equity">Equity</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="commentary">Commentary</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <VelocityDashboard {...dashboardData} />
              </TabsContent>

              <TabsContent value="pnl">
                <PnLReport />
              </TabsContent>

              <TabsContent value="equity">
                <EquityTracker />
              </TabsContent>

              <TabsContent value="config">
                <VelocityStrategyConfig
                  enabled={strategyEnabled}
                  onEnabledChange={toggleStrategy}
                  accountEquity={accountEquity}
                  onAccountEquityChange={setAccountEquity}
                  velocityMultiplier={velocityMultiplier}
                  onVelocityMultiplierChange={setVelocityMultiplier}
                  volumeMultiplier={volumeMultiplier}
                  onVolumeMultiplierChange={setVolumeMultiplier}
                  rsiUpperThreshold={rsiUpperThreshold}
                  onRsiUpperThresholdChange={setRsiUpperThreshold}
                  rsiLowerThreshold={rsiLowerThreshold}
                  onRsiLowerThresholdChange={setRsiLowerThreshold} />
              </TabsContent>

              <TabsContent value="positions">
                <PositionStatus positions={positions} totalRiskUsed={totalRiskUsed} />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceMetrics {...performanceMetrics} />
              </TabsContent>

              <TabsContent value="commentary">
                <AgentCommentaryFeed messages={commentary} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <AgentCommentaryFeed messages={commentary} />
          </div>
        </div>
      </div>
    </div>);

}