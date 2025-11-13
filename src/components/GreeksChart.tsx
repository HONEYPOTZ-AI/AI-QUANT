import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface GreeksSnapshot {
  snapshot_time: string;
  total_delta: number;
  total_gamma: number;
  total_theta: number;
  total_vega: number;
  total_rho: number;
}

interface GreeksChartProps {
  data: GreeksSnapshot[];
  selectedGreeks: string[];
}

export default function GreeksChart({ data, selectedGreeks }: GreeksChartProps) {
  const chartData = data.map(snapshot => ({
    time: format(new Date(snapshot.snapshot_time), 'MM/dd HH:mm'),
    Delta: snapshot.total_delta,
    Gamma: snapshot.total_gamma,
    Theta: snapshot.total_theta,
    Vega: snapshot.total_vega,
    Rho: snapshot.total_rho,
  }));

  const greeksConfig = {
    Delta: { color: '#10b981', show: selectedGreeks.includes('Delta') },
    Gamma: { color: '#3b82f6', show: selectedGreeks.includes('Gamma') },
    Theta: { color: '#ef4444', show: selectedGreeks.includes('Theta') },
    Vega: { color: '#8b5cf6', show: selectedGreeks.includes('Vega') },
    Rho: { color: '#f59e0b', show: selectedGreeks.includes('Rho') },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Greeks Over Time</CardTitle>
        <CardDescription>Historical portfolio Greeks evolution</CardDescription>
      </CardHeader>
      <CardContent>
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
                  borderRadius: '6px',
                }}
              />
              <Legend />
              {Object.entries(greeksConfig).map(([greek, config]) => 
                config.show && (
                  <Line
                    key={greek}
                    type="monotone"
                    dataKey={greek}
                    stroke={config.color}
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