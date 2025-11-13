import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AttributionData {
  delta_pnl: number;
  gamma_pnl: number;
  theta_pnl: number;
  vega_pnl: number;
  rho_pnl: number;
  other_pnl: number;
  total_pnl: number;
}

interface PnLAttributionBreakdownProps {
  data: AttributionData;
}

export default function PnLAttributionBreakdown({ data }: PnLAttributionBreakdownProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const calculatePercentage = (value: number) => {
    if (data.total_pnl === 0) return 0;
    return Math.abs((value / data.total_pnl) * 100);
  };

  const attributions = [
    { 
      label: 'Delta P&L', 
      value: data.delta_pnl, 
      description: 'P&L from underlying price movement',
      color: 'bg-green-500'
    },
    { 
      label: 'Gamma P&L', 
      value: data.gamma_pnl, 
      description: 'P&L from delta changes (convexity)',
      color: 'bg-blue-500'
    },
    { 
      label: 'Theta P&L', 
      value: data.theta_pnl, 
      description: 'P&L from time decay',
      color: 'bg-red-500'
    },
    { 
      label: 'Vega P&L', 
      value: data.vega_pnl, 
      description: 'P&L from volatility changes',
      color: 'bg-purple-500'
    },
    { 
      label: 'Rho P&L', 
      value: data.rho_pnl, 
      description: 'P&L from interest rate changes',
      color: 'bg-orange-500'
    },
    { 
      label: 'Other P&L', 
      value: data.other_pnl, 
      description: 'Residual and other factors',
      color: 'bg-gray-500'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed P&L Attribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-3xl font-bold ${data.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.total_pnl)}
            </p>
          </div>
          {data.total_pnl >= 0 ? (
            <TrendingUp className="h-8 w-8 text-green-600" />
          ) : (
            <TrendingDown className="h-8 w-8 text-red-600" />
          )}
        </div>

        <div className="space-y-4">
          {attributions.map((item, index) => {
            const percentage = calculatePercentage(item.value);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={item.color}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}