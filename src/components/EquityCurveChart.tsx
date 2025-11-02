
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

interface EquityCurveChartProps {
  data: Array<{
    date: string;
    equityBalance: number;
    highWatermark: number;
  }>;
}

export default function EquityCurveChart({ data }: EquityCurveChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      date: format(new Date(item.date), 'MM/dd'),
      fullDate: item.date,
      Equity: item.equityBalance,
      "High Watermark": item.highWatermark
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const averageEquity = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.equityBalance, 0);
    return sum / data.length;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fontSize: 12 }} />

            <YAxis
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency} />

            <Tooltip
              formatter={formatCurrency}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return format(new Date(payload[0].payload.fullDate), 'MMM dd, yyyy');
                }
                return label;
              }} />

            <ReferenceLine
              y={averageEquity}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              label={{ value: "Average", position: "right", fill: "#64748b", fontSize: 12 }} />

            <Line
              type="monotone"
              dataKey="Equity"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }} />

            <Line
              type="monotone"
              dataKey="High Watermark"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false} />

          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>);

}