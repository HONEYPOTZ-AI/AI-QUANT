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
  rsi = 50,
}: VelocityDashboardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Real-time Strategy Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-slate-400 text-xs">Market Structure</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white text-sm">Trend Bias (5m):</span>
                {trendBias5m === 'bullish' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Bullish
                  </Badge>
                ) : trendBias5m === 'bearish' ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Bearish
                  </Badge>
                ) : (
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                    Neutral
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-white text-sm">Context (1H):</span>
                {trendBias1h === 'bullish' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Bullish
                  </Badge>
                ) : trendBias1h === 'bearish' ? (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Bearish
                  </Badge>
                ) : (
                  <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                    Neutral
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-slate-400 text-xs">Range Compression</Label>
              <div className="flex items-center gap-2 mt-1">
                {compressionDetected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      Detected ({compressionCount} candles)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">Not Detected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-slate-400 text-xs">CDC Velocity</Label>
                <span className="text-blue-400 font-mono text-sm">
                  {cdcVelocity.ratio.toFixed(2)}x
                </span>
              </div>
              <Progress 
                value={Math.min(cdcVelocity.ratio * 20, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Current: {cdcVelocity.current.toFixed(3)}</span>
                <span>Avg: {cdcVelocity.average.toFixed(3)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-slate-400 text-xs">Volume Status</Label>
                <span className="text-purple-400 font-mono text-sm">
                  {volume.ratio.toFixed(2)}x
                </span>
              </div>
              <Progress 
                value={Math.min(volume.ratio * 33, 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Current: {volume.current.toLocaleString()}</span>
                <span>Avg: {volume.average.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-white text-sm font-semibold">Active Signals</Label>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {activeSignals.length}
            </Badge>
          </div>
          {activeSignals.length > 0 ? (
            <div className="space-y-2">
              {activeSignals.slice(0, 3).map((signal, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border ${
                    signal.type === 'long'
                      ? 'bg-green-900/20 border-green-500/30'
                      : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold uppercase ${
                      signal.type === 'long' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {signal.type} Breakout
                    </span>
                    <span className="text-white text-sm font-mono">
                      ${signal.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(signal.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400 text-sm">
              No active breakout signals
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
