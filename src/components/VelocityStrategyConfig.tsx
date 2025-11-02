import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings2, Lock } from 'lucide-react';

interface VelocityStrategyConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  accountEquity: number;
  onAccountEquityChange: (equity: number) => void;
  velocityMultiplier: number;
  onVelocityMultiplierChange: (value: number) => void;
  volumeMultiplier: number;
  onVolumeMultiplierChange: (value: number) => void;
  rsiUpperThreshold: number;
  onRsiUpperThresholdChange: (value: number) => void;
  rsiLowerThreshold: number;
  onRsiLowerThresholdChange: (value: number) => void;
}

export default function VelocityStrategyConfig({
  enabled,
  onEnabledChange,
  accountEquity,
  onAccountEquityChange,
  velocityMultiplier,
  onVelocityMultiplierChange,
  volumeMultiplier,
  onVolumeMultiplierChange,
  rsiUpperThreshold,
  onRsiUpperThresholdChange,
  rsiLowerThreshold,
  onRsiLowerThresholdChange
}: VelocityStrategyConfigProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-400" />
          Strategy Configuration
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure Velocity-Triggered Range Breakout parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-white font-medium">Enable Strategy</Label>
            <p className="text-xs text-slate-400 mt-1">Auto-execute trades when signals detected</p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Account Equity ($)</Label>
            <Input
              type="number"
              value={accountEquity}
              onChange={(e) => onAccountEquityChange(parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="10000" />

          </div>

          <div className="space-y-2">
            <Label className="text-white flex items-center gap-2">
              Max Risk per Trade
              <Lock className="w-3 h-3 text-slate-400" />
            </Label>
            <div className="relative">
              <Input
                value="2%"
                disabled
                className="bg-slate-900/50 border-slate-700 text-slate-300" />

              <Badge className="absolute right-2 top-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                Locked
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white">Timeframes</Label>
            <div className="flex gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                5-min Entry
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                1H Context
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white">Technical Parameters</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white text-sm">Velocity Multiplier</Label>
              <span className="text-blue-400 font-mono text-sm">{velocityMultiplier.toFixed(1)}x</span>
            </div>
            <Input
              type="range"
              min="1.5"
              max="4.0"
              step="0.1"
              value={velocityMultiplier}
              onChange={(e) => onVelocityMultiplierChange(parseFloat(e.target.value))}
              className="w-full" />

          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white text-sm">Volume Multiplier</Label>
              <span className="text-purple-400 font-mono text-sm">{volumeMultiplier.toFixed(1)}x</span>
            </div>
            <Input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={volumeMultiplier}
              onChange={(e) => onVolumeMultiplierChange(parseFloat(e.target.value))}
              className="w-full" />

          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white text-sm">RSI Upper Threshold</Label>
              <Input
                type="number"
                value={rsiUpperThreshold}
                onChange={(e) => onRsiUpperThresholdChange(parseFloat(e.target.value) || 55)}
                className="bg-slate-700 border-slate-600 text-white"
                min="50"
                max="70" />

            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm">RSI Lower Threshold</Label>
              <Input
                type="number"
                value={rsiLowerThreshold}
                onChange={(e) => onRsiLowerThresholdChange(parseFloat(e.target.value) || 45)}
                className="bg-slate-700 border-slate-600 text-white"
                min="30"
                max="50" />

            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}