import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function GreeksChart() {
  const { user } = useAuth();
  const [selectedGreeks, setSelectedGreeks] = useState(['Delta', 'Theta', 'Vega']);
  const [days, setDays] = useState(7);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['greeks-history', user?.ID, days],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.run({
        path: 'greeksHistoricalData',
        param: [user?.ID, days]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    staleTime: 60000
  });

  const greeksOptions = [
    { value: 'Delta', label: 'Delta', color: '#10b981' },
    { value: 'Gamma', label: 'Gamma', color: '#3b82f6' },
    { value: 'Theta', label: 'Theta', color: '#ef4444' },
    { value: 'Vega', label: 'Vega', color: '#8b5cf6' },
    { value: 'Rho', label: 'Rho', color: '#f59e0b' }
  ];

  const toggleGreek = (greek: string) => {
    setSelectedGreeks(prev => 
      prev.includes(greek) 
        ? prev.filter(g => g !== greek)
        : [...prev, greek]
    );
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
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load historical Greeks data'}
        </AlertDescription>
      </Alert>
    );
  }

  const snapshots = data?.snapshots || [];
  
  const chartData = snapshots.map((snapshot: any) => ({
    time: format(new Date(snapshot.snapshot_time), 'MM/dd HH:mm'),
    Delta: snapshot.total_delta,
    Gamma: snapshot.total_gamma,
    Theta: snapshot.total_theta,
    Vega: snapshot.total_vega,
    Rho: snapshot.total_rho
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Greeks Over Time</CardTitle>
            <CardDescription>Historical portfolio Greeks evolution</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              {[7, 14, 30].map(d => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          {greeksOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={selectedGreeks.includes(option.value)}
                onCheckedChange={() => toggleGreek(option.value)}
              />
              <label
                htmlFor={option.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                style={{ color: option.color }}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No historical data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              {greeksOptions.map(option => 
                selectedGreeks.includes(option.value) && (
                  <Line
                    key={option.value}
                    type="monotone"
                    dataKey={option.value}
                    stroke={option.color}
                    strokeWidth={2}
                    dot={false}
                  />
                )
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}