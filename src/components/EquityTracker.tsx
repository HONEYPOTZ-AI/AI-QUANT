
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EquityBalance from "./EquityBalance";
import EquityCurveChart from "./EquityCurveChart";

export default function EquityTracker() {
  const [loading, setLoading] = useState(false);
  const [broker, setBroker] = useState("ALL");
  const [equityData, setEquityData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const fetchEquityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/equityHistoricalData.js",
        param: [broker, 30]
      });

      if (error) {
        throw new Error(error);
      }

      setEquityData({
        startingEquity: data.startingEquity,
        currentEquity: data.currentEquity,
        change: data.change,
        changePercent: data.changePercent,
        highWatermark: data.highWatermark,
        cashBalance: data.snapshots[data.snapshots.length - 1]?.cashBalance || 0,
        marginUsed: data.snapshots[data.snapshots.length - 1]?.marginUsed || 0,
        availableMargin: data.snapshots[data.snapshots.length - 1]?.availableMargin || 0,
        unrealizedPnL: data.snapshots[data.snapshots.length - 1]?.unrealizedPnL || 0
      });
      setHistoricalData(data.snapshots || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch equity data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSnapshot = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/equitySnapshotSaver.js",
        param: [broker]
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Success",
        description: "Equity snapshot saved successfully"
      });

      await fetchEquityData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save equity snapshot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquityData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchEquityData, 300000);
    return () => clearInterval(interval);
  }, [broker]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Equity Balance Tracker</CardTitle>
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
                onClick={saveSnapshot}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Save Snapshot
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !equityData ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : equityData ? (
            <>
              <EquityBalance data={equityData} />
              {historicalData.length > 0 && (
                <EquityCurveChart data={historicalData} />
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No equity data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
