import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface VelocityDashboardProps {
  trendBias5m?: string;
  trendBias1h?: string;
  compressionDetected?: boolean;
  compressionCount?: number;
  cdcVelocity?: {
    current: number;
    average: number;
    ratio: number;
  };
  volume?: {
    current: number;
    average: number;
    ratio: number;
  };
  activeSignals?: Array<{
    type: string;
    price: number;
    timestamp: string;
  }>;
  currentPrice?: number;
  rsi?: number;
}

export default function VelocityDashboard({
  trendBias5m = 'neutral',
  trendBias1h = 'neutral',
  compressionDetected = false,
  compressionCount = 0,
  cdcVelocity = { current: 0, average: 0, ratio: 0 },
  volume = { current: 0, average: 0, ratio: 0 },
  activeSignals = [],
  currentPrice = 0,
  rsi = 50
}: VelocityDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">5m Trend</div>
              <Badge className={`${
              trendBias5m === 'bullish' ? 'bg-green-500/20 text-green-400' :
              trendBias5m === 'bearish' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'}`
              }>
                {trendBias5m === 'bullish' ? <TrendingUp className="w-4 h-4 mr-1 inline" /> :
                trendBias5m === 'bearish' ? <TrendingDown className="w-4 h-4 mr-1 inline" /> : null}
                {trendBias5m}
              </Badge>
            </div>
            
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">1h Trend</div>
              <Badge className={`${
              trendBias1h === 'bullish' ? 'bg-green-500/20 text-green-400' :
              trendBias1h === 'bearish' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-500/20 text-slate-400'}`
              }>
                {trendBias1h === 'bullish' ? <TrendingUp className="w-4 h-4 mr-1 inline" /> :
                trendBias1h === 'bearish' ? <TrendingDown className="w-4 h-4 mr-1 inline" /> : null}
                {trendBias1h}
              </Badge>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Compression</div>
              <div className="flex items-center gap-2">
                {compressionDetected ?
                <CheckCircle className="w-5 h-5 text-green-400" /> :
                <AlertCircle className="w-5 h-5 text-orange-400" />
                }
                <span className="text-white font-bold">{compressionCount} bars</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-2">CDC Velocity</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-white font-mono">{cdcVelocity.current.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Average:</span>
                  <span className="text-white font-mono">{cdcVelocity.average.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ratio:</span>
                  <span className={`font-mono font-bold ${cdcVelocity.ratio >= 2.5 ? 'text-green-400' : 'text-slate-400'}`}>
                    {cdcVelocity.ratio.toFixed(2)}x
                  </span>
                </div>
                <Progress value={Math.min(100, cdcVelocity.ratio / 3 * 100)} className="h-2" />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-2">Volume Analysis</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Ratio:</span>
                  <span className={`font-mono font-bold ${volume.ratio >= 1.5 ? 'text-green-400' : 'text-slate-400'}`}>
                    {volume.ratio.toFixed(2)}x
                  </span>
                </div>
                <Progress value={Math.min(100, volume.ratio / 2 * 100)} className="h-2" />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-sm text-slate-400 mb-1">RSI</div>
                <div className="text-2xl font-bold text-white">{rsi.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {activeSignals.length > 0 &&
          <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
              <div className="text-sm font-semibold text-blue-400 mb-2">Active Signals</div>
              {activeSignals.map((signal, idx) =>
            <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium uppercase">{signal.type}</span>
                  <span className="text-slate-400">@ {signal.price?.toFixed(2)}</span>
                </div>
            )}
            </div>
          }

          {currentPrice > 0 &&
          <div className="text-center pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">Current Price</div>
              <div className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</div>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}