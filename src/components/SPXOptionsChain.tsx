import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface OptionData {
  symbol: string;
  type: string;
  strike: number;
  expiration: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  volume: number | null;
  openInterest: number | null;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  inTheMoney: boolean;
  intrinsicValue: number;
}

interface OptionsChainData {
  symbol: string;
  underlyingPrice: number | null;
  options: OptionData[];
  totalContracts: number;
  source: string;
  timestamp: string;
}

interface StrikeRow {
  strike: number;
  call: OptionData | null;
  put: OptionData | null;
}

export default function SPXOptionsChain() {
  const { user } = useAuth();
  const [selectedExpiration, setSelectedExpiration] = useState<string>('');

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['spx-options-chain', selectedExpiration],
    queryFn: async () => {
      console.log('🔄 [SPXOptionsChain] Fetching options chain for expiration:', selectedExpiration || 'all');
      try {
        const params = selectedExpiration ? { expirationDate: selectedExpiration } : {};
        const result = await window.ezsite.apis.run({
          path: 'spxOptionsChainFetcher',
          methodName: 'fetchSPXOptionsChain',
          param: [params]
        });
        console.log('📊 [SPXOptionsChain] API Response:', result);

        if (result.error) {
          console.error('❌ [SPXOptionsChain] Error from backend:', result.error);
          throw new Error(result.error);
        }

        console.log('✅ [SPXOptionsChain] Successfully fetched options chain. Total contracts:', result.data?.totalContracts);
        return result.data as OptionsChainData;
      } catch (err) {
        console.error('❌ [SPXOptionsChain] Exception during fetch:', err);
        throw err;
      }
    },
    enabled: true, // Always enabled - no auth requirement
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  // Log state changes
  console.log('🔗 [SPXOptionsChain] Component state:', {
    isLoading,
    isFetching,
    hasData: !!data,
    optionsCount: data?.options?.length,
    hasError: !!error,
    errorMessage: error?.message
  });

  // Show toast notification on error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Options Chain Update Failed',
        description: error.message || 'Unable to fetch SPX options chain data',
        variant: 'destructive'
      });
    }
  }, [error]);

  // Extract unique expiration dates
  const expirationDates = data?.options ?
  [...new Set(data.options.map((opt) => opt.expiration))].sort() :
  [];

  // Set default expiration to nearest date if not set
  if (!selectedExpiration && expirationDates.length > 0) {
    setSelectedExpiration(expirationDates[0]);
  }

  // Group options by strike price
  const strikeRows: StrikeRow[] = [];
  if (data?.options) {
    const strikeMap = new Map<number, StrikeRow>();

    data.options.
    filter((opt) => !selectedExpiration || opt.expiration === selectedExpiration).
    forEach((option) => {
      if (!strikeMap.has(option.strike)) {
        strikeMap.set(option.strike, { strike: option.strike, call: null, put: null });
      }
      const row = strikeMap.get(option.strike)!;
      if (option.type === 'CALL') {
        row.call = option;
      } else if (option.type === 'PUT') {
        row.put = option;
      }
    });

    strikeMap.forEach((row) => strikeRows.push(row));
    strikeRows.sort((a, b) => a.strike - b.strike);
  }

  const formatPrice = (val: number | null) => val !== null ? `$${val.toFixed(2)}` : '-';
  const formatNumber = (val: number | null) => val !== null ? val.toLocaleString() : '-';
  const formatPercent = (val: number | null) => val !== null ? `${(val * 100).toFixed(1)}%` : '-';
  const formatGreek = (val: number | null) => val !== null ? val.toFixed(4) : '-';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load options chain: {error.message}
        </AlertDescription>
      </Alert>);

  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No options chain data available</AlertDescription>
      </Alert>);

  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">SPX Options Chain</CardTitle>
              {data.underlyingPrice &&
              <p className="text-xs sm:text-sm text-muted-foreground">
                  Underlying: <span className="font-semibold text-foreground">${data.underlyingPrice.toFixed(2)}</span>
                </p>
              }
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  {expirationDates.map((date) =>
                  <SelectItem key={date} value={date}>
                      {format(new Date(date), 'MMM dd, yyyy')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2 shrink-0">

                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="rounded-lg border overflow-hidden min-w-[800px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {/* Calls Header */}
                  <th colSpan={5} className="border-r-2 border-border p-3 text-center font-semibold bg-green-50">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">CALLS</span>
                    </div>
                  </th>
                  {/* Strike Header */}
                  <th className="p-3 text-center font-semibold bg-gray-100">Strike</th>
                  {/* Puts Header */}
                  <th colSpan={5} className="border-l-2 border-border p-3 text-center font-semibold bg-red-50">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-red-700">PUTS</span>
                    </div>
                  </th>
                </tr>
                <tr className="text-xs">
                  {/* Call Columns */}
                  <th className="p-2 text-right font-medium border-r">Volume</th>
                  <th className="p-2 text-right font-medium border-r">OI</th>
                  <th className="p-2 text-right font-medium border-r">Bid</th>
                  <th className="p-2 text-right font-medium border-r">Ask</th>
                  <th className="p-2 text-right font-medium border-r-2 border-border">Last</th>
                  {/* Strike */}
                  <th className="p-2 text-center font-medium bg-gray-50">Price</th>
                  {/* Put Columns */}
                  <th className="p-2 text-left font-medium border-l-2 border-border">Last</th>
                  <th className="p-2 text-left font-medium border-l">Bid</th>
                  <th className="p-2 text-left font-medium border-l">Ask</th>
                  <th className="p-2 text-left font-medium border-l">OI</th>
                  <th className="p-2 text-left font-medium border-l">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {strikeRows.length === 0 ?
                <tr>
                    <td colSpan={11} className="p-8 text-center text-muted-foreground">
                      No options data available for selected expiration
                    </td>
                  </tr> :

                strikeRows.map((row) => {
                  const isAtTheMoney = data.underlyingPrice &&
                  Math.abs(row.strike - data.underlyingPrice) < 50;

                  return (
                    <tr
                      key={row.strike}
                      className={`hover:bg-muted/50 transition-colors ${
                      isAtTheMoney ? 'bg-blue-50/50 font-medium' : ''}`
                      }>

                        {/* Call Data */}
                        <td className={`p-2 text-right border-r ${row.call?.inTheMoney ? 'bg-green-50/30' : ''}`}>
                          {formatNumber(row.call?.volume)}
                        </td>
                        <td className={`p-2 text-right border-r ${row.call?.inTheMoney ? 'bg-green-50/30' : ''}`}>
                          {formatNumber(row.call?.openInterest)}
                        </td>
                        <td className={`p-2 text-right border-r ${row.call?.inTheMoney ? 'bg-green-50/30' : ''}`}>
                          {formatPrice(row.call?.bid)}
                        </td>
                        <td className={`p-2 text-right border-r ${row.call?.inTheMoney ? 'bg-green-50/30' : ''}`}>
                          {formatPrice(row.call?.ask)}
                        </td>
                        <td className={`p-2 text-right border-r-2 border-border font-medium ${row.call?.inTheMoney ? 'bg-green-50/30' : ''}`}>
                          {formatPrice(row.call?.last)}
                        </td>
                        
                        {/* Strike Price */}
                        <td className={`p-2 text-center font-semibold bg-gray-50 ${isAtTheMoney ? 'bg-blue-100 text-blue-700' : ''}`}>
                          {row.strike.toFixed(0)}
                        </td>
                        
                        {/* Put Data */}
                        <td className={`p-2 text-left border-l-2 border-border font-medium ${row.put?.inTheMoney ? 'bg-red-50/30' : ''}`}>
                          {formatPrice(row.put?.last)}
                        </td>
                        <td className={`p-2 text-left border-l ${row.put?.inTheMoney ? 'bg-red-50/30' : ''}`}>
                          {formatPrice(row.put?.bid)}
                        </td>
                        <td className={`p-2 text-left border-l ${row.put?.inTheMoney ? 'bg-red-50/30' : ''}`}>
                          {formatPrice(row.put?.ask)}
                        </td>
                        <td className={`p-2 text-left border-l ${row.put?.inTheMoney ? 'bg-red-50/30' : ''}`}>
                          {formatNumber(row.put?.openInterest)}
                        </td>
                        <td className={`p-2 text-left border-l ${row.put?.inTheMoney ? 'bg-red-50/30' : ''}`}>
                          {formatNumber(row.put?.volume)}
                        </td>
                      </tr>);

                })
                }
              </tbody>
            </table>
          </div>
        </ScrollArea>

        {/* Footer Info */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Total Contracts: {data.totalContracts}</span>
            <span>•</span>
            <span>Source: {data.source}</span>
          </div>
          {data.timestamp &&
          <span>Last updated: {format(new Date(data.timestamp), 'PPpp')}</span>
          }
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span>In-the-money calls</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span>In-the-money puts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span>At-the-money strikes</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}