import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RefreshCw, Filter, PieChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PortfolioGreeksSummary from "@/components/PortfolioGreeksSummary";
import OptionsGreeksTable from "@/components/OptionsGreeksTable";
import GreeksChart from "@/components/GreeksChart";
import PnLAttributionChart from "@/components/PnLAttributionChart";
import PnLAttributionBreakdown from "@/components/PnLAttributionBreakdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Table IDs
const TABLES = {
  OPTIONS_POSITIONS: 58032,
  GREEKS_SNAPSHOTS: 58033,
  PNL_ATTRIBUTION: 58034
};

export default function OptionsGreeksPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [greeksSnapshots, setGreeksSnapshots] = useState<any[]>([]);
  const [attribution, setAttribution] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGreeks, setSelectedGreeks] = useState(['Delta', 'Gamma', 'Theta', 'Vega']);
  const [filterType, setFilterType] = useState<string>('all');

  const portfolioGreeks = {
    delta: positions.reduce((sum, pos) => sum + pos.delta * pos.quantity, 0),
    gamma: positions.reduce((sum, pos) => sum + pos.gamma * pos.quantity, 0),
    theta: positions.reduce((sum, pos) => sum + pos.theta * pos.quantity * 100, 0),
    vega: positions.reduce((sum, pos) => sum + pos.vega * pos.quantity, 0),
    rho: positions.reduce((sum, pos) => sum + pos.rho * pos.quantity, 0)
  };

  const portfolioValue = positions.reduce(
    (sum, pos) => sum + pos.quantity * pos.current_price * 100,
    0
  );

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
      fetchPositions(),
      fetchGreeksSnapshots(),
      fetchAttribution()]
      );
      toast({
        title: "Data Loaded",
        description: "Options Greeks data updated successfully"
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(TABLES.OPTIONS_POSITIONS, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "id",
        IsAsc: false,
        Filters: filterType !== 'all' ? [
        { name: "option_type", op: "Equal", value: filterType }] :
        []
      });

      if (error) throw error;
      setPositions(data?.List || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  };

  const fetchGreeksSnapshots = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(TABLES.GREEKS_SNAPSHOTS, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: "snapshot_time",
        IsAsc: false
      });

      if (error) throw error;
      setGreeksSnapshots(data?.List || []);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  };

  const fetchAttribution = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(TABLES.PNL_ATTRIBUTION, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "attribution_date",
        IsAsc: false
      });

      if (error) throw error;

      if (data?.List && data.List.length > 0) {
        setAttribution(data.List[0]);
      } else {
        // Set default attribution if no data
        setAttribution({
          delta_pnl: 0,
          gamma_pnl: 0,
          theta_pnl: 0,
          vega_pnl: 0,
          rho_pnl: 0,
          other_pnl: 0,
          total_pnl: 0
        });
      }
    } catch (error) {
      console.error('Error fetching attribution:', error);
      throw error;
    }
  };

  const handleGreeksToggle = (greek: string) => {
    setSelectedGreeks((prev) =>
    prev.includes(greek) ?
    prev.filter((g) => g !== greek) :
    [...prev, greek]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-700">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <PieChart className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                  Options Greeks & P&L Attribution
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Monitor portfolio Greeks and analyze P&L attribution
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-slate-800 border-slate-700">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Position Type</Label>
                      <Select value={filterType} onValueChange={(value) => {
                        setFilterType(value);
                        fetchPositions();
                      }}>
                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="all">All Positions</SelectItem>
                          <SelectItem value="Call">Calls Only</SelectItem>
                          <SelectItem value="Put">Puts Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={fetchAllData} disabled={loading} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        <PortfolioGreeksSummary greeks={portfolioGreeks} portfolioValue={portfolioValue} />

        <Tabs defaultValue="greeks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-slate-800 border-slate-700">
            <TabsTrigger value="greeks" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">Greeks Analysis</TabsTrigger>
            <TabsTrigger value="attribution" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">P&L Attribution</TabsTrigger>
          </TabsList>

          <TabsContent value="greeks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <GreeksChart
                  data={greeksSnapshots}
                  selectedGreeks={selectedGreeks} />

              </div>
              
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Chart Options</CardTitle>
                  <CardDescription className="text-slate-400">Select Greeks to display</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Delta', 'Gamma', 'Theta', 'Vega', 'Rho'].map((greek) =>
                  <div key={greek} className="flex items-center space-x-2">
                      <Checkbox
                      id={greek}
                      checked={selectedGreeks.includes(greek)}
                      onCheckedChange={() => handleGreeksToggle(greek)} />

                      <Label htmlFor={greek} className="cursor-pointer text-slate-300">
                        {greek}
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Position Greeks</CardTitle>
                <CardDescription className="text-slate-400">
                  Individual options positions with Greeks values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptionsGreeksTable positions={positions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {attribution &&
              <>
                  <PnLAttributionChart data={attribution} />
                  <PnLAttributionBreakdown data={attribution} />
                </>
              }
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">About P&L Attribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-slate-300">Delta P&L:</strong> Profit/loss from changes in the underlying asset price.
                  This is the most significant component for directional trades.
                </p>
                <p>
                  <strong className="text-slate-300">Gamma P&L:</strong> Profit/loss from changes in delta as the underlying moves.
                  This captures the convexity/curvature effect of options.
                </p>
                <p>
                  <strong className="text-slate-300">Theta P&L:</strong> Profit/loss from time decay. Typically negative for long options
                  and positive for short options.
                </p>
                <p>
                  <strong className="text-slate-300">Vega P&L:</strong> Profit/loss from changes in implied volatility.
                  Important for volatility trading strategies.
                </p>
                <p>
                  <strong className="text-slate-300">Rho P&L:</strong> Profit/loss from interest rate changes.
                  Usually a smaller component for most options trades.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}