import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PnLAttributionChart() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('daily');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['pnl-attribution', user?.ID, period],
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
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className={`text-lg ${payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>);

    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load P&L attribution'}
        </AlertDescription>
      </Alert>);

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

  const chartData = [
  { name: 'Delta P&L', value: attribution.delta_pnl, fill: '#10b981' },
  { name: 'Gamma P&L', value: attribution.gamma_pnl, fill: '#3b82f6' },
  { name: 'Theta P&L', value: attribution.theta_pnl, fill: '#ef4444' },
  { name: 'Vega P&L', value: attribution.vega_pnl, fill: '#8b5cf6' },
  { name: 'Rho P&L', value: attribution.rho_pnl, fill: '#f59e0b' },
  { name: 'Other P&L', value: attribution.other_pnl, fill: '#6b7280' }];


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>P&L Attribution Breakdown</CardTitle>
            <CardDescription>
              Total P&L: <span className={`font-bold text-lg ${attribution.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(attribution.total_pnl)}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly'].map((p) =>
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}>

                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}>

              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatCurrency} />

            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              width={100} />

            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) =>
              <Cell key={`cell-${index}`} fill={entry.fill} />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>);

}