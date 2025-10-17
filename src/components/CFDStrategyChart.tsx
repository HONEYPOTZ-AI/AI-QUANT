import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceDot } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  const arrowSize = 12;
  
  return (
    <g>
      {/* Arrow */}
      {isLong ? (
        <path
          d={`M ${cx} ${cy - 20} L ${cx - arrowSize/2} ${cy - 20 + arrowSize} L ${cx + arrowSize/2} ${cy - 20 + arrowSize} Z`}
          fill={color}
          stroke="white"
          strokeWidth={2}
        />
      ) : (
        <path
          d={`M ${cx} ${cy + 20} L ${cx - arrowSize/2} ${cy + 20 - arrowSize} L ${cx + arrowSize/2} ${cy + 20 - arrowSize} Z`}
          fill={color}
          stroke="white"
          strokeWidth={2}
        />
      )}
      {/* Dot */}
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, signals }: any) => {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload;
  const signal = signals.find((s: Signal) => s.timestamp === data.timestamp);
  const isPositive = data.close >= data.open;
  
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-white font-semibold mb-2">{data.time || label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Open:</span>
          <span className="text-white font-medium">${data.open.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">High:</span>
          <span className="text-green-400 font-medium">${data.high.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Low:</span>
          <span className="text-red-400 font-medium">${data.low.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Close:</span>
          <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${data.close.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-400">Volume:</span>
          <span className="text-white font-medium">{data.volume.toLocaleString()}</span>
        </div>
      </div>
      
      {signal && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            {signal.type === 'long' ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold uppercase">Long Signal</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold uppercase">Short Signal</span>
              </>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Price:</span>
              <span className="text-white font-medium">${signal.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">RSI:</span>
              <span className="text-blue-400 font-medium">{signal.rsi}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">MACD:</span>
              <span className="text-purple-400 font-medium">{signal.macd.toFixed(4)}</span>
            </div>
          </div>
          <p className="text-slate-300 text-xs mt-2 italic">
            {signal.commentary}
          </p>
        </div>
      )}
    </div>
  );
};

export default function CFDStrategyChart({ data, signals, height = 500 }: CFDStrategyChartProps) {
  // Prepare data with candlestick calculations
  const chartData = data.map(d => ({
    ...d,
    highY: d.high,
    lowY: d.low,
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));
  
  return (
    <div style={{ height: `${height}px` }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 30, right: 30, bottom: 30, left: 10 }}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
          <Bar 
            yAxisId="price"
            dataKey="open"
            shape={<CustomCandlestick />}
          />
          
          {/* Signal markers */}
          {signals.map((signal, idx) => {
            const dataPoint = chartData.find(d => d.timestamp === signal.timestamp);
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
  );
}