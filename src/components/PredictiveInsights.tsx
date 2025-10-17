
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, Target, Zap, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const PredictiveInsights = () => {
  const [predictions, setPredictions] = useState({
    nextDay: { direction: 'bullish', probability: 73.2, targetPrice: 4795.80 },
    nextWeek: { direction: 'bullish', probability: 68.9, targetPrice: 4820.50 },
    nextMonth: { direction: 'neutral', probability: 56.7, targetPrice: 4785.20 }
  });

  const [confidence, setConfidence] = useState(87.3);

  const forecastData = [
  { time: 'Today', actual: 4782.35, predicted: 4782.35, upper: 4782.35, lower: 4782.35 },
  { time: '+1D', actual: null, predicted: 4795.80, upper: 4820.30, lower: 4771.30 },
  { time: '+2D', actual: null, predicted: 4801.25, upper: 4835.60, lower: 4766.90 },
  { time: '+3D', actual: null, predicted: 4809.15, upper: 4855.40, lower: 4762.90 },
  { time: '+4D', actual: null, predicted: 4815.60, upper: 4875.20, lower: 4756.00 },
  { time: '+5D', actual: null, predicted: 4820.50, upper: 4890.80, lower: 4750.20 },
  { time: '+1W', actual: null, predicted: 4820.50, upper: 4910.30, lower: 4730.70 },
  { time: '+2W', actual: null, predicted: 4805.20, upper: 4925.50, lower: 4684.90 }];


  const aiModels = [
  {
    name: 'LSTM Deep Neural Network',
    type: 'Time Series',
    accuracy: 89.2,
    status: 'active',
    lastTrained: '2 hours ago'
  },
  {
    name: 'Prophet Forecasting',
    type: 'Statistical',
    accuracy: 84.7,
    status: 'active',
    lastTrained: '4 hours ago'
  },
  {
    name: 'Transformer Model',
    type: 'Attention-Based',
    accuracy: 91.5,
    status: 'training',
    lastTrained: '1 day ago'
  },
  {
    name: 'Ensemble Model',
    type: 'Combined',
    accuracy: 93.1,
    status: 'active',
    lastTrained: '30 minutes ago'
  }];


  const marketFactors = [
  { factor: 'Technical Indicators', impact: 85, direction: 'bullish' },
  { factor: 'Options Flow', impact: 72, direction: 'bearish' },
  { factor: 'Macroeconomic Data', impact: 68, direction: 'neutral' },
  { factor: 'Sentiment Analysis', impact: 79, direction: 'bullish' },
  { factor: 'Volume Patterns', impact: 81, direction: 'bullish' }];


  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Prediction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-white">Next Day</span>
              </div>
              {getDirectionIcon(predictions.nextDay.direction)}
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                ${predictions.nextDay.targetPrice.toFixed(2)}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getDirectionColor(predictions.nextDay.direction)}`}>
                  {predictions.nextDay.direction.toUpperCase()}
                </span>
                <span className="text-sm text-slate-400">
                  {predictions.nextDay.probability}% confidence
                </span>
              </div>
              <Progress value={predictions.nextDay.probability} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-medium text-white">Next Week</span>
              </div>
              {getDirectionIcon(predictions.nextWeek.direction)}
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                ${predictions.nextWeek.targetPrice.toFixed(2)}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getDirectionColor(predictions.nextWeek.direction)}`}>
                  {predictions.nextWeek.direction.toUpperCase()}
                </span>
                <span className="text-sm text-slate-400">
                  {predictions.nextWeek.probability}% confidence
                </span>
              </div>
              <Progress value={predictions.nextWeek.probability} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-white">Next Month</span>
              </div>
              {getDirectionIcon(predictions.nextMonth.direction)}
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                ${predictions.nextMonth.targetPrice.toFixed(2)}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getDirectionColor(predictions.nextMonth.direction)}`}>
                  {predictions.nextMonth.direction.toUpperCase()}
                </span>
                <span className="text-sm text-slate-400">
                  {predictions.nextMonth.probability}% confidence
                </span>
              </div>
              <Progress value={predictions.nextMonth.probability} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI Price Forecast
          </CardTitle>
          <CardDescription>Machine learning predictions with confidence intervals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={['dataMin - 20', 'dataMax + 20']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} />

                <Area
                  type="monotone"
                  dataKey="upper"
                  stackId="1"
                  stroke="none"
                  fill="#3B82F6"
                  fillOpacity={0.1} />

                <Area
                  type="monotone"
                  dataKey="lower"
                  stackId="1"
                  stroke="none"
                  fill="#FFFFFF"
                  fillOpacity={0} />

                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />

              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-slate-300">Actual Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-slate-300">AI Prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500/20 rounded-full" />
              <span className="text-slate-300">Confidence Interval</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Models Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Models Performance
            </CardTitle>
            <CardDescription>Active machine learning models and their accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiModels.map((model, index) =>
              <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{model.name}</h4>
                      <p className="text-sm text-slate-400">{model.type}</p>
                    </div>
                    <Badge
                    variant={model.status === 'active' ? 'default' : model.status === 'training' ? 'secondary' : 'outline'}
                    className={
                    model.status === 'active' ? 'bg-green-500/10 text-green-400' :
                    model.status === 'training' ? 'bg-blue-500/10 text-blue-400' : ''
                    }>

                      {model.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Accuracy</span>
                      <span className="text-sm font-medium text-white">{model.accuracy}%</span>
                    </div>
                    <Progress value={model.accuracy} className="h-2" />
                    <div className="text-xs text-slate-500">
                      Last trained: {model.lastTrained}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Factors */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Market Factors Impact
            </CardTitle>
            <CardDescription>Key factors influencing AI predictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketFactors.map((factor, index) =>
              <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{factor.factor}</span>
                      {getDirectionIcon(factor.direction)}
                    </div>
                    <div className="text-sm font-medium text-white">
                      {factor.impact}% impact
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={factor.impact} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Influence Level</span>
                      <span className={`font-medium ${getDirectionColor(factor.direction)}`}>
                        {factor.direction.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default PredictiveInsights;