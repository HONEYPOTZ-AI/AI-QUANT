
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EquityBalanceProps {
  data: {
    startingEquity: number;
    currentEquity: number;
    change: number;
    changePercent: number;
    highWatermark: number;
    cashBalance: number;
    marginUsed: number;
    availableMargin: number;
    unrealizedPnL: number;
  };
}

export default function EquityBalance({ data }: EquityBalanceProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const marginUsagePercent = data.cashBalance > 0 ?
  data.marginUsed / data.cashBalance * 100 :
  0;

  const drawdownPercent = data.highWatermark > 0 ?
  (data.highWatermark - data.currentEquity) / data.highWatermark * 100 :
  0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Equity</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.currentEquity)}
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <span className={`text-sm font-medium ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.change)}
              </span>
              <span className={`text-sm ${data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({formatPercent(data.changePercent)})
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Starting: {formatCurrency(data.startingEquity)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Watermark</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(data.highWatermark)}
            </div>
            <div className="mt-2">
              {drawdownPercent > 0 &&
              <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">
                    Drawdown: {drawdownPercent.toFixed(2)}%
                  </span>
                </div>
              }
              {drawdownPercent === 0 &&
              <span className="text-sm text-green-600 font-medium">
                  At All-Time High ✓
                </span>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.cashBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available funds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.marginUsed)}
            </div>
            <div className="mt-2">
              <Progress value={marginUsagePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {marginUsagePercent.toFixed(1)}% of cash
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {data.unrealizedPnL >= 0 ?
            <TrendingUp className="h-4 w-4 text-green-600" /> :

            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.unrealizedPnL)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From open positions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);

}