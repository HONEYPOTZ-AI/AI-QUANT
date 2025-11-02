import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

interface PerformanceMetricsProps {
  winRate: number;
  avgRiskReward: number;
  totalTrades: number;
  velocityAccuracy: {
    hits: number;
    false: number;
    accuracy: number;
  };
}

export default function PerformanceMetrics({
  winRate,
  avgRiskReward,
  totalTrades,
  velocityAccuracy,
}: PerformanceMetricsProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{winRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 mt-1">Win Rate</div>
          </div>

          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{avgRiskReward.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">Avg R:R Ratio</div>
          </div>

          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalTrades}</div>
            <div className="text-xs text-slate-400 mt-1">Total Trades</div>
          </div>

          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {velocityAccuracy.accuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Velocity Accuracy</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Velocity Spike Performance</span>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {velocityAccuracy.hits} / {velocityAccuracy.hits + velocityAccuracy.false}
            </Badge>
          </div>
          <div className="flex gap-2 text-xs">
            <div className="flex-1 p-2 bg-green-900/20 rounded border border-green-500/30">
              <div className="text-green-400 font-semibold">{velocityAccuracy.hits}</div>
              <div className="text-slate-400">Confirmed Hits</div>
            </div>
            <div className="flex-1 p-2 bg-red-900/20 rounded border border-red-500/30">
              <div className="text-red-400 font-semibold">{velocityAccuracy.false}</div>
              <div className="text-slate-400">False Signals</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
