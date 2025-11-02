
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface PnLChartProps {
  data: Array<{
    date: string;
    dailyPnL: number;
    weeklyPnL: number;
    monthlyPnL: number;
    totalPnL: number;
  }>;
}

export default function PnLChart({ data }: PnLChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: format(new Date(item.date), 'MM/dd'),
      fullDate: item.date,
      Daily: item.dailyPnL,
      Weekly: item.weeklyPnL,
      Monthly: item.monthlyPnL,
      Total: item.totalPnL
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>P&L Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="line">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={formatCurrency}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return format(new Date(payload[0].payload.fullDate), 'MMM dd, yyyy');
                    }
                    return label;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Daily" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Total" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="bar">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={formatCurrency}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return format(new Date(payload[0].payload.fullDate), 'MMM dd, yyyy');
                    }
                    return label;
                  }}
                />
                <Legend />
                <Bar dataKey="Daily" fill="#10b981" />
                <Bar dataKey="Weekly" fill="#3b82f6" />
                <Bar dataKey="Monthly" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
