import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown, Plus, RefreshCw, AlertCircle, X, Eye, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import SPXPriceHeader from '@/components/SPXPriceHeader';
import { format } from 'date-fns';

export default function IronCondorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Strategy Builder Form State
  const [formData, setFormData] = useState({
    symbol: 'SPX',
    expirationDate: '',
    contracts: 1,
    longCallStrike: 0,
    shortCallStrike: 0,
    shortPutStrike: 0,
    longPutStrike: 0,
    notes: ''
  });

  // Risk/Reward Calculator State
  const [riskReward, setRiskReward] = useState({
    maxProfit: 0,
    maxLoss: 0,
    upperBreakeven: 0,
    lowerBreakeven: 0,
    probabilityOfProfit: 0,
    requiredMargin: 0
  });

  // Fetch active strategies
  const { data: activeStrategies, isLoading: loadingStrategies, refetch: refetchStrategies } = useQuery({
    queryKey: ['iron-condor-active', user?.ID],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'ironCondorStrategy',
        methodName: 'getActiveStrategies',
        param: [user?.ID]
      });
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!user?.ID,
    refetchInterval: 30000
  });

  // Fetch performance analytics
  const { data: performanceData } = useQuery({
    queryKey: ['iron-condor-performance', user?.ID],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.tablePage(74342, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'entry_date',
        IsAsc: false,
        Filters: [{ name: 'user_id', op: 'Equal', value: user?.ID }]
      });
      if (error) throw new Error(error);
      
      const strategies = data?.List || [];
      const totalStrategies = strategies.length;
      const closedStrategies = strategies.filter((s: any) => s.status === 'CLOSED');
      const winningTrades = closedStrategies.filter((s: any) => (s.current_pnl || 0) > 0).length;
      const winRate = closedStrategies.length > 0 ? (winningTrades / closedStrategies.length) * 100 : 0;
      const avgPnL = closedStrategies.length > 0 
        ? closedStrategies.reduce((sum: number, s: any) => sum + (s.current_pnl || 0), 0) / closedStrategies.length 
        : 0;
      const totalTheta = strategies
        .filter((s: any) => s.status === 'OPEN')
        .reduce((sum: number, s: any) => sum + (s.current_theta || 0), 0);

      return {
        totalStrategies,
        winRate: winRate.toFixed(1),
        avgPnL: avgPnL.toFixed(2),
        totalTheta: totalTheta.toFixed(2),
        historicalData: strategies
      };
    },
    enabled: !!user?.ID
  });

  // Create strategy mutation
  const createStrategyMutation = useMutation({
    mutationFn: async (strategyConfig: any) => {
      const result = await window.ezsite.apis.run({
        path: 'ironCondorStrategy',
        methodName: 'createIronCondor',
        param: [user?.ID, strategyConfig]
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Iron condor strategy created successfully' });
      queryClient.invalidateQueries({ queryKey: ['iron-condor-active'] });
      queryClient.invalidateQueries({ queryKey: ['iron-condor-performance'] });
      setShowBuilder(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Close strategy mutation
  const closeStrategyMutation = useMutation({
    mutationFn: async ({ strategyId, notes }: { strategyId: number; notes?: string }) => {
      const result = await window.ezsite.apis.run({
        path: 'ironCondorStrategy',
        methodName: 'closeStrategy',
        param: [strategyId, { notes }]
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Strategy closed successfully' });
      queryClient.invalidateQueries({ queryKey: ['iron-condor-active'] });
      queryClient.invalidateQueries({ queryKey: ['iron-condor-performance'] });
      setShowDetailModal(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Calculate risk/reward when form changes
  useEffect(() => {
    calculateRiskReward();
  }, [formData]);

  const calculateRiskReward = () => {
    const { longCallStrike, shortCallStrike, shortPutStrike, longPutStrike, contracts } = formData;
    
    if (!longCallStrike || !shortCallStrike || !shortPutStrike || !longPutStrike || !contracts) {
      return;
    }

    const callSpreadWidth = longCallStrike - shortCallStrike;
    const putSpreadWidth = shortPutStrike - longPutStrike;
    
    // Estimate credit (simplified - in production, fetch real option prices)
    const estimatedCredit = ((callSpreadWidth + putSpreadWidth) * 0.3) * contracts * 100;
    
    const maxProfit = estimatedCredit;
    const maxLoss = (Math.max(callSpreadWidth, putSpreadWidth) * contracts * 100) - estimatedCredit;
    const upperBreakeven = shortCallStrike + (estimatedCredit / (contracts * 100));
    const lowerBreakeven = shortPutStrike - (estimatedCredit / (contracts * 100));
    const probabilityOfProfit = 65; // Simplified estimate
    const requiredMargin = Math.max(callSpreadWidth, putSpreadWidth) * contracts * 100;

    setRiskReward({
      maxProfit,
      maxLoss,
      upperBreakeven,
      lowerBreakeven,
      probabilityOfProfit,
      requiredMargin
    });
  };

  const generatePayoffData = () => {
    const { shortCallStrike, shortPutStrike, longCallStrike, longPutStrike } = formData;
    if (!shortCallStrike || !shortPutStrike) return [];

    const data = [];
    const range = (longCallStrike - longPutStrike) || 100;
    const start = shortPutStrike - range * 0.3;
    const end = shortCallStrike + range * 0.3;
    const step = (end - start) / 50;

    for (let price = start; price <= end; price += step) {
      let pnl = riskReward.maxProfit;
      
      if (price < longPutStrike) {
        pnl = riskReward.maxProfit - (longPutStrike - price) * formData.contracts * 100;
      } else if (price < shortPutStrike) {
        pnl = riskReward.maxProfit - (shortPutStrike - price) * formData.contracts * 100;
      } else if (price > longCallStrike) {
        pnl = riskReward.maxProfit - (price - longCallStrike) * formData.contracts * 100;
      } else if (price > shortCallStrike) {
        pnl = riskReward.maxProfit - (price - shortCallStrike) * formData.contracts * 100;
      }

      data.push({ price: price.toFixed(0), pnl: parseFloat(pnl.toFixed(2)) });
    }

    return data;
  };

  const handleCreateStrategy = async () => {
    if (!formData.expirationDate) {
      toast({ title: 'Error', description: 'Please select an expiration date', variant: 'destructive' });
      return;
    }

    if (formData.longPutStrike >= formData.shortPutStrike || 
        formData.shortPutStrike >= formData.shortCallStrike ||
        formData.shortCallStrike >= formData.longCallStrike) {
      toast({ title: 'Error', description: 'Invalid strike order', variant: 'destructive' });
      return;
    }

    createStrategyMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      symbol: 'SPX',
      expirationDate: '',
      contracts: 1,
      longCallStrike: 0,
      shortCallStrike: 0,
      shortPutStrike: 0,
      longPutStrike: 0,
      notes: ''
    });
  };

  const getDaysToExpiration = (expDate: string) => {
    const today = new Date();
    const exp = new Date(expDate);
    const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access Iron Condor strategies.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8 pt-16">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Iron Condor Strategies</h1>
            <p className="text-slate-400 mt-1">Manage and monitor your SPX iron condor positions</p>
          </div>
          <Button onClick={() => setShowBuilder(!showBuilder)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Strategy
          </Button>
        </div>

        {/* SPX Price Header */}
        <SPXPriceHeader />

        <Tabs defaultValue="strategies" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="strategies">Active Strategies</TabsTrigger>
            <TabsTrigger value="builder">Strategy Builder</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          {/* Active Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Active Positions</CardTitle>
                  <CardDescription>Real-time updates every 30 seconds</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchStrategies()} disabled={loadingStrategies}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingStrategies ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingStrategies ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="rounded-md border border-slate-700 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">Strategy</TableHead>
                          <TableHead className="text-slate-300">Strikes (LP/SP/SC/LC)</TableHead>
                          <TableHead className="text-slate-300">Expiration</TableHead>
                          <TableHead className="text-slate-300 text-right">DTE</TableHead>
                          <TableHead className="text-slate-300 text-right">P&L</TableHead>
                          <TableHead className="text-slate-300 text-right">Delta</TableHead>
                          <TableHead className="text-slate-300 text-right">Theta</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!activeStrategies || activeStrategies.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                              No active strategies. Create one to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          activeStrategies.map((strategy: any) => {
                            const dte = getDaysToExpiration(strategy.expiration_date);
                            const isProfitable = (strategy.current_pnl || 0) > 0;
                            
                            return (
                              <TableRow 
                                key={strategy.id} 
                                className="border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                                onClick={() => {
                                  setSelectedStrategy(strategy);
                                  setShowDetailModal(true);
                                }}
                              >
                                <TableCell className="font-medium text-white">
                                  {strategy.symbol} {format(new Date(strategy.entry_date), 'MM/dd')}
                                </TableCell>
                                <TableCell className="text-slate-300 font-mono text-sm">
                                  {strategy.long_put_strike}/{strategy.short_put_strike}/
                                  {strategy.short_call_strike}/{strategy.long_call_strike}
                                </TableCell>
                                <TableCell className="text-slate-300">
                                  {format(new Date(strategy.expiration_date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={dte <= 7 ? 'destructive' : 'secondary'}>
                                    {dte}d
                                  </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                                  {isProfitable ? '+' : ''}${(strategy.current_pnl || 0).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-slate-300">
                                  {(strategy.current_delta || 0).toFixed(3)}
                                </TableCell>
                                <TableCell className="text-right text-green-400">
                                  ${(strategy.current_theta || 0).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-green-500/20 text-green-400">
                                    {strategy.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedStrategy(strategy);
                                      setShowDetailModal(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Create Iron Condor</CardTitle>
                  <CardDescription>Configure your iron condor strategy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol" className="text-slate-300">Underlying</Label>
                      <Input
                        id="symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contracts" className="text-slate-300">Contracts</Label>
                      <Input
                        id="contracts"
                        type="number"
                        min="1"
                        value={formData.contracts}
                        onChange={(e) => setFormData({ ...formData, contracts: parseInt(e.target.value) || 1 })}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration" className="text-slate-300">Expiration Date</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="bg-slate-900 border-slate-600 text-white"
                    />
                  </div>

                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-medium text-slate-300">Strike Prices</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="longCall" className="text-xs text-slate-400">Long Call</Label>
                        <Input
                          id="longCall"
                          type="number"
                          step="5"
                          value={formData.longCallStrike || ''}
                          onChange={(e) => setFormData({ ...formData, longCallStrike: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border-slate-600 text-white"
                          placeholder="e.g., 5800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortCall" className="text-xs text-slate-400">Short Call</Label>
                        <Input
                          id="shortCall"
                          type="number"
                          step="5"
                          value={formData.shortCallStrike || ''}
                          onChange={(e) => setFormData({ ...formData, shortCallStrike: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border-slate-600 text-white"
                          placeholder="e.g., 5750"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortPut" className="text-xs text-slate-400">Short Put</Label>
                        <Input
                          id="shortPut"
                          type="number"
                          step="5"
                          value={formData.shortPutStrike || ''}
                          onChange={(e) => setFormData({ ...formData, shortPutStrike: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border-slate-600 text-white"
                          placeholder="e.g., 5650"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longPut" className="text-xs text-slate-400">Long Put</Label>
                        <Input
                          id="longPut"
                          type="number"
                          step="5"
                          value={formData.longPutStrike || ''}
                          onChange={(e) => setFormData({ ...formData, longPutStrike: parseFloat(e.target.value) || 0 })}
                          className="bg-slate-900 border-slate-600 text-white"
                          placeholder="e.g., 5600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-slate-300">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-slate-900 border-slate-600 text-white"
                      placeholder="Strategy notes..."
                    />
                  </div>

                  <Button 
                    onClick={handleCreateStrategy} 
                    className="w-full"
                    disabled={createStrategyMutation.isPending}
                  >
                    {createStrategyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Position'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Risk/Reward & Payoff Diagram */}
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Risk/Reward Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="text-xs text-slate-400">Max Profit</div>
                        <div className="text-xl font-bold text-green-400">
                          ${riskReward.maxProfit.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-xs text-slate-400">Max Loss</div>
                        <div className="text-xl font-bold text-red-400">
                          ${riskReward.maxLoss.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-xs text-slate-400">Upper BE</div>
                        <div className="text-lg font-semibold text-blue-400">
                          {riskReward.upperBreakeven.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="text-xs text-slate-400">Lower BE</div>
                        <div className="text-lg font-semibold text-blue-400">
                          {riskReward.lowerBreakeven.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="text-xs text-slate-400">Prob. of Profit</div>
                        <div className="text-lg font-semibold text-purple-400">
                          {riskReward.probabilityOfProfit.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="text-xs text-slate-400">Required Margin</div>
                        <div className="text-lg font-semibold text-orange-400">
                          ${riskReward.requiredMargin.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Payoff Diagram</CardTitle>
                    <CardDescription>P&L at expiration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generatePayoffData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="price" 
                            stroke="#9CA3AF"
                            label={{ value: 'SPX Price', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="pnl"
                            stroke="#3B82F6"
                            fill="url(#pnlGradient)"
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                              <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Performance Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400">Total Strategies</div>
                  <div className="text-3xl font-bold text-white mt-2">
                    {performanceData?.totalStrategies || 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400">Win Rate</div>
                  <div className="text-3xl font-bold text-green-400 mt-2">
                    {performanceData?.winRate || 0}%
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400">Average P&L</div>
                  <div className="text-3xl font-bold text-blue-400 mt-2">
                    ${performanceData?.avgPnL || 0}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="text-sm text-slate-400">Total Theta</div>
                  <div className="text-3xl font-bold text-purple-400 mt-2">
                    ${performanceData?.totalTheta || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Historical Performance</CardTitle>
                <CardDescription>All strategies performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData?.historicalData?.slice(-30) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="entry_date" 
                        stroke="#9CA3AF"
                        tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="current_pnl" 
                        stroke="#10B981" 
                        name="P&L"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Strategy Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Strategy Details</DialogTitle>
            <DialogDescription>
              {selectedStrategy?.symbol} Iron Condor - {selectedStrategy && format(new Date(selectedStrategy.entry_date), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStrategy && (
            <StrategyDetailView 
              strategy={selectedStrategy} 
              onClose={() => closeStrategyMutation.mutate({ strategyId: selectedStrategy.id })}
              isClosing={closeStrategyMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Strategy Detail Component
function StrategyDetailView({ strategy, onClose, isClosing }: any) {
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadStrategyData();
  }, [strategy.id]);

  const loadStrategyData = async () => {
    try {
      // Load performance history
      const perfResult = await window.ezsite.apis.run({
        path: 'ironCondorStrategy',
        methodName: 'getStrategyPerformanceHistory',
        param: [strategy.id, 7]
      });
      if (!perfResult.error) {
        setPerformanceHistory(perfResult.data || []);
      }

      // Load alerts
      const alertsResult = await window.ezsite.apis.run({
        path: 'ironCondorStrategy',
        methodName: 'getStrategyAlerts',
        param: [strategy.id, 10]
      });
      if (!alertsResult.error) {
        setAlerts(alertsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading strategy data:', error);
    }
  };

  const isProfitable = (strategy.current_pnl || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">Current P&L</div>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            {isProfitable ? '+' : ''}${(strategy.current_pnl || 0).toFixed(2)}
          </div>
        </div>
        <div className="p-4 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">Delta</div>
          <div className="text-2xl font-bold text-white">
            {(strategy.current_delta || 0).toFixed(3)}
          </div>
        </div>
        <div className="p-4 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">Theta</div>
          <div className="text-2xl font-bold text-green-400">
            ${(strategy.current_theta || 0).toFixed(2)}
          </div>
        </div>
        <div className="p-4 bg-slate-700 rounded-lg">
          <div className="text-xs text-slate-400">Max Profit</div>
          <div className="text-2xl font-bold text-blue-400">
            ${(strategy.max_profit || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Legs Display */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">Position Legs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="p-3 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Long Call</div>
                <div className="text-lg font-semibold text-white">{strategy.long_call_strike}</div>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Short Call</div>
                <div className="text-lg font-semibold text-white">{strategy.short_call_strike}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Short Put</div>
                <div className="text-lg font-semibold text-white">{strategy.short_put_strike}</div>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <div className="text-xs text-slate-400">Long Put</div>
                <div className="text-lg font-semibold text-white">{strategy.long_put_strike}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg">P&L History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="snapshot_time" 
                  stroke="#9CA3AF"
                  tickFormatter={(time) => format(new Date(time), 'MM/dd HH:mm')}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="current_pnl" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert: any) => (
                <Alert key={alert.id} className="bg-slate-800 border-slate-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="flex justify-between items-start">
                      <span>{alert.message}</span>
                      <Badge variant={alert.severity === 'WARNING' ? 'destructive' : 'secondary'} className="text-xs">
                        {alert.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {format(new Date(alert.triggered_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-600">
        <Button variant="outline" onClick={() => window.close()}>
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={onClose}
          disabled={isClosing}
        >
          {isClosing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Closing...
            </>
          ) : (
            'Close Position'
          )}
        </Button>
      </div>
    </div>
  );
}