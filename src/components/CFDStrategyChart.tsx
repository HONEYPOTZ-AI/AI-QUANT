import React, { useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceDot, Label } from 'recharts';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Signal {
  timestamp: string;
  type: 'long' | 'short';
  price: number;
  rsi: number;
  macd: number;
  volume: number;
  commentary: string;
}

interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time?: string;
}

interface CFDStrategyChartProps {
  data: ChartData[];
  signals: Signal[];
  height?: number;
}

const CustomCandlestick = (props: any) => {
  const { x, y, width, height, fill, payload } = props;
  const isPositive = payload.close >= payload.open;
  const color = isPositive ? '#10b981' : '#ef4444';
  const bodyHeight = Math.abs(y - (payload.close >= payload.open ? y + height : y));

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={payload.highY}
        x2={x + width / 2}
        y2={payload.lowY}
        stroke={color}
        strokeWidth={1}
      />

      {/* Body */}
      <rect
        x={x}
        y={isPositive ? y + height : y}
        width={width}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

const CustomSignalDot = (props: any) => {
  const { cx, cy, payload, signals } = props;
  const signal = signals.find((s: Signal) => s.timestamp === payload.timestamp);

  if (!signal) return null;

  const isLong = signal.type === 'long';
  const color = isLong ? '#10b981' : '#ef4444';
  const arrowSize = 14;
  const arrowY = isLong ? cy - 25 : cy + 25;

  return (
    <g>
      {/* Arrow with glow effect */}
      <defs>
        <filter id={`glow-${signal.timestamp}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Arrow */}
      {isLong ? (
        <path
          d={`M ${cx} ${arrowY} L ${cx - arrowSize / 2} ${arrowY + arrowSize} L ${cx + arrowSize / 2} ${arrowY + arrowSize} Z`}
          fill={color}
          stroke="white"
          strokeWidth={2}
          filter={`url(#glow-${signal.timestamp})`}
        />
      ) : (
        <path
          d={`M ${cx} ${arrowY} L ${cx - arrowSize / 2} ${arrowY - arrowSize} L ${cx + arrowSize / 2} ${arrowY - arrowSize} Z`}
          fill={color}
          stroke="white"
          strokeWidth={2}
          filter={`url(#glow-${signal.timestamp})`}
        />
      )}

      {/* Connecting line */}
      <line
        x1={cx}
        y1={isLong ? arrowY + arrowSize : arrowY - arrowSize}
        x2={cx}
        y2={cy}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="3,3"
      />

      {/* Dot at price level */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke="white"
        strokeWidth={2}
        filter={`url(#glow-${signal.timestamp})`}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, signals }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const signal = signals.find((s: Signal) => s.timestamp === data.timestamp);
  const isPositive = data.close >= data.open;

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-2xl">
      <p className="text-white font-semibold mb-2 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-400" />
        {data.time || label}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Open:</span>
          <span className="text-white font-medium">${data.open.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">High:</span>
          <span className="text-green-400 font-medium">${data.high.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Low:</span>
          <span className="text-red-400 font-medium">${data.low.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Close:</span>
          <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${data.close.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Volume:</span>
          <span className="text-white font-medium">{data.volume.toLocaleString()}</span>
        </div>
      </div>

      {signal && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            {signal.type === 'long' ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold uppercase text-sm">Long Signal</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold uppercase text-sm">Short Signal</span>
              </>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Entry Price:</span>
              <span className="text-white font-medium">${signal.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">RSI(14):</span>
              <span className="text-blue-400 font-medium">{signal.rsi}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">MACD:</span>
              <span className="text-purple-400 font-medium">{signal.macd.toFixed(4)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Volume:</span>
              <span className="text-cyan-400 font-medium">{signal.volume.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-slate-800/50 rounded border border-slate-600/50">
            <p className="text-slate-300 text-xs leading-relaxed italic">
              {signal.commentary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const SignalsList = ({ signals }: { signals: Signal[] }) => {
  if (signals.length === 0) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <p className="text-slate-400 text-sm text-center">No trading signals detected</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {signals.map((signal, idx) => (
        <Card
          key={idx}
          className={`p-3 border-l-4 ${
            signal.type === 'long'
              ? 'bg-green-500/10 border-l-green-500 border-green-500/30'
              : 'bg-red-500/10 border-l-red-500 border-red-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            {signal.type === 'long' ? (
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-bold text-sm uppercase ${
                    signal.type === 'long' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {signal.type}
                </span>
                <span className="text-slate-400 text-xs">@</span>
                <span className="text-white text-sm font-medium">${signal.price.toFixed(2)}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{signal.commentary}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-blue-400">RSI: {signal.rsi}</span>
                <span className="text-purple-400">MACD: {signal.macd.toFixed(4)}</span>
                <span className="text-cyan-400">Vol: {(signal.volume / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default function CFDStrategyChart({ data, signals, height = 500 }: CFDStrategyChartProps) {
  // Prepare data with candlestick calculations
  const chartData = data.map((d) => ({
    ...d,
    highY: d.high,
    lowY: d.low,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="space-y-4">
      {/* Main Chart */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            CFD Strategy Chart
            <span className="text-xs font-normal text-slate-400">
              ({signals.length} signal{signals.length !== 1 ? 's' : ''} detected)
            </span>
          </h3>
        </div>

        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 40, right: 30, bottom: 30, left: 10 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                stroke="#475569"
              />
              <YAxis
                yAxisId="price"
                domain={['dataMin - 50', 'dataMax + 50']}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                stroke="#475569"
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                stroke="#475569"
              />
              <Tooltip content={<CustomTooltip signals={signals} />} />

              {/* Volume bars */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="url(#volumeGradient)"
                opacity={0.3}
                radius={[4, 4, 0, 0]}
              />

              {/* Candlesticks */}
              <Bar yAxisId="price" dataKey="open" shape={<CustomCandlestick />} />

              {/* Signal markers */}
              {signals.map((signal, idx) => {
                const dataPoint = chartData.find((d) => d.timestamp === signal.timestamp);
                if (!dataPoint) return null;

                return (
                  <ReferenceDot
                    key={idx}
                    x={dataPoint.time}
                    y={signal.price}
                    yAxisId="price"
                    shape={<CustomSignalDot signals={signals} />}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Signals List */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-3">Trading Signals</h3>
        <SignalsList signals={signals} />
      </Card>
    </div>
  );
}
