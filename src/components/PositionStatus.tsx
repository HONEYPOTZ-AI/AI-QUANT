import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';

interface Position {
  id: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnlPoints: number;
  pnlPercent: number;
  pnlAmount: number;
}

interface PositionStatusProps {
  positions: Position[];
  totalRiskUsed: number;
}

export default function PositionStatus({ positions, totalRiskUsed }: PositionStatusProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Position Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-400">Risk Used:</span>
            <Badge className={`${
              totalRiskUsed > 1.5
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }`}>
              {totalRiskUsed.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No open positions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className={`p-4 rounded-lg border ${
                  position.side === 'long'
                    ? 'bg-green-900/10 border-green-500/30'
                    : 'bg-red-900/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {position.side === 'long' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`font-bold uppercase text-sm ${
                      position.side === 'long' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.side} Position
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {position.lotSize} lots
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      position.pnlAmount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnlAmount >= 0 ? '+' : ''}${position.pnlAmount.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {position.pnlAmount >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Entry</span>
                    <span className="text-white font-mono">${position.entryPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Current</span>
                    <span className="text-white font-mono">${position.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Stop Loss</span>
                    <span className="text-red-400 font-mono">${position.stopLoss.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Take Profit</span>
                    <span className="text-green-400 font-mono">${position.takeProfit.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold">Position Size Calculation:</span>
                    <span className="ml-2">
                      Risk Amount / ({Math.abs(position.entryPrice - position.stopLoss).toFixed(2)} pts × $1) = {position.lotSize} lots
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    P&L: {position.pnlAmount >= 0 ? '+' : ''}{position.pnlPoints.toFixed(2)} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
