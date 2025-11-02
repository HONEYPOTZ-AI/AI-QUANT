
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface PnLMetricsProps {
  metrics: {
    grossPnL: number;
    netPnL: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
  };
}

export default function PnLMetrics({ metrics }: PnLMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
          {metrics.netPnL >= 0 ?
          <TrendingUp className="h-4 w-4 text-green-600" /> :

          <TrendingDown className="h-4 w-4 text-red-600" />
          }
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(metrics.netPnL)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gross: {formatCurrency(metrics.grossPnL)}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Percent className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatPercent(metrics.winRate)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.winningTrades}W / {metrics.losingTrades}L
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Win/Loss</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            <span className="text-green-600">{formatCurrency(metrics.avgWin)}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-red-600">{formatCurrency(metrics.avgLoss)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ratio: {metrics.avgLoss > 0 ? (metrics.avgWin / metrics.avgLoss).toFixed(2) : 'N/A'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Best/Worst Trade</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            <span className="text-green-600">{formatCurrency(metrics.largestWin)}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-red-600">{formatCurrency(metrics.largestLoss)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalTrades} total trades
          </p>
        </CardContent>
      </Card>
    </div>);

}