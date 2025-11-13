import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface AttributionData {
  delta_pnl: number;
  gamma_pnl: number;
  theta_pnl: number;
  vega_pnl: number;
  rho_pnl: number;
  other_pnl: number;
  total_pnl: number;
}

interface PnLAttributionChartProps {
  data: AttributionData;
}

export default function PnLAttributionChart({ data }: PnLAttributionChartProps) {
  const chartData = [
    { name: 'Delta P&L', value: data.delta_pnl, fill: '#10b981' },
    { name: 'Gamma P&L', value: data.gamma_pnl, fill: '#3b82f6' },
    { name: 'Theta P&L', value: data.theta_pnl, fill: '#ef4444' },
    { name: 'Vega P&L', value: data.vega_pnl, fill: '#8b5cf6' },
    { name: 'Rho P&L', value: data.rho_pnl, fill: '#f59e0b' },
    { name: 'Other P&L', value: data.other_pnl, fill: '#6b7280' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Attribution Breakdown</CardTitle>
        <CardDescription>
          Total P&L: <span className={`font-bold text-lg ${data.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.total_pnl)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatCurrency}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}