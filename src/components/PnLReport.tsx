
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PnLMetrics from "./PnLMetrics";
import PnLChart from "./PnLChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PnLReport() {
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState("ALL");
  const [period, setPeriod] = useState("daily");
  const [pnlData, setPnlData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const fetchPnLData = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/pnlCalculator.js",
        param: [broker, period]
      });

      if (error) {
        throw new Error(error);
      }

      setPnlData(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch P&L data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/pnlHistoricalData.js",
        param: [broker, 30]
      });

      if (error) {
        throw new Error(error);
      }

      setHistoricalData(data.snapshots || []);
    } catch (error: any) {
      console.error("Failed to fetch historical data:", error);
    }
  };

  const syncPositions = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/positionsSyncHandler.js",
        param: []
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: "Positions synced successfully"
      });

      // Refresh P&L data after sync
      await fetchPnLData();
      await fetchHistoricalData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync positions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!pnlData) return;

    const csvData = [
      ["P&L Report"],
      ["Period", period],
      ["Broker", broker],
      ["Generated", new Date().toISOString()],
      [],
      ["Metric", "Value"],
      ["Gross P&L", pnlData.grossPnL],
      ["Net P&L", pnlData.netPnL],
      ["Total Commission", pnlData.totalCommission],
      ["Total Trades", pnlData.totalTrades],
      ["Winning Trades", pnlData.winningTrades],
      ["Losing Trades", pnlData.losingTrades],
      ["Win Rate", pnlData.winRate + "%"],
      ["Average Win", pnlData.avgWin],
      ["Average Loss", pnlData.avgLoss],
      ["Largest Win", pnlData.largestWin],
      ["Largest Loss", pnlData.largestLoss],
      [],
      ["Symbol Breakdown"],
      ["Symbol", "Total P&L", "Trades", "Wins", "Losses"]
    ];

    pnlData.symbolBreakdown?.forEach((item: any) => {
      csvData.push([
        item.symbol,
        item.totalPnL,
        item.trades,
        item.wins,
        item.losses
      ]);
    });

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl_report_${broker}_${period}_${new Date().toISOString()}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "P&L report exported successfully"
    });
  };

  useEffect(() => {
    fetchPnLData();
    fetchHistoricalData();
  }, [broker, period]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>P&L Reports</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={broker} onValueChange={setBroker}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Brokers</SelectItem>
                  <SelectItem value="IBRK">IBRK</SelectItem>
                  <SelectItem value="cTrader">cTrader</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={syncPositions}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={!pnlData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="total">Total</TabsTrigger>
            </TabsList>

            <TabsContent value={period} className="space-y-4 mt-4">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pnlData ? (
                <>
                  <PnLMetrics metrics={pnlData} />
                  
                  {historicalData.length > 0 && (
                    <PnLChart data={historicalData} />
                  )}

                  {pnlData.symbolBreakdown && pnlData.symbolBreakdown.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Breakdown by Symbol</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead className="text-right">Total P&L</TableHead>
                                <TableHead className="text-right">Trades</TableHead>
                                <TableHead className="text-right">Wins</TableHead>
                                <TableHead className="text-right">Losses</TableHead>
                                <TableHead className="text-right">Win Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pnlData.symbolBreakdown.map((item: any, index: number) => {
                                const winRate = item.trades > 0 ? (item.wins / item.trades) * 100 : 0;
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{item.symbol}</TableCell>
                                    <TableCell className={`text-right font-medium ${item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      ${item.totalPnL.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">{item.trades}</TableCell>
                                    <TableCell className="text-right text-green-600">{item.wins}</TableCell>
                                    <TableCell className="text-right text-red-600">{item.losses}</TableCell>
                                    <TableCell className="text-right">{winRate.toFixed(1)}%</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No P&L data available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
