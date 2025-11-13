import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PnLAttributionBreakdown() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('daily');

  const { data, isLoading, error } = useQuery({
    queryKey: ['pnl-attribution-detail', user?.ID, period],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.run({
        path: 'pnlAttributionCalculator',
        param: [user?.ID, period]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    staleTime: 60000
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.abs(value / total * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load P&L breakdown'}
        </AlertDescription>
      </Alert>
    );
  }

  const attribution = data || {
    delta_pnl: 0,
    gamma_pnl: 0,
    theta_pnl: 0,
    vega_pnl: 0,
    rho_pnl: 0,
    other_pnl: 0,
    total_pnl: 0
  };

  const attributions = [
    {
      label: 'Delta P&L',
      value: attribution.delta_pnl,
      description: 'P&L from underlying price movement',
      color: 'bg-green-500'
    },
    {
      label: 'Gamma P&L',
      value: attribution.gamma_pnl,
      description: 'P&L from delta changes (convexity)',
      color: 'bg-blue-500'
    },
    {
      label: 'Theta P&L',
      value: attribution.theta_pnl,
      description: 'P&L from time decay',
      color: 'bg-red-500'
    },
    {
      label: 'Vega P&L',
      value: attribution.vega_pnl,
      description: 'P&L from volatility changes',
      color: 'bg-purple-500'
    },
    {
      label: 'Rho P&L',
      value: attribution.rho_pnl,
      description: 'P&L from interest rate changes',
      color: 'bg-orange-500'
    },
    {
      label: 'Other P&L',
      value: attribution.other_pnl,
      description: 'Residual and other factors',
      color: 'bg-gray-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detailed P&L Attribution</CardTitle>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(p => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-3xl font-bold ${attribution.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(attribution.total_pnl)}
            </p>
          </div>
          {attribution.total_pnl >= 0 ? (
            <TrendingUp className="h-8 w-8 text-green-600" />
          ) : (
            <TrendingDown className="h-8 w-8 text-red-600" />
          )}
        </div>

        <div className="space-y-4">
          {attributions.map((item, index) => {
            const percentage = calculatePercentage(item.value, attribution.total_pnl);
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