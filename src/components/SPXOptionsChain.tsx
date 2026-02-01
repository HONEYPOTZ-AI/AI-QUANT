import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OptionContract {
  symbol: string;
  description: string;
  type: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  daysToExpiration: number;
  underlyingTicker: string;
  exerciseStyle: string;
  sharesPerContract: number;
  cfi: string;
  primaryExchange: string;
  inTheMoney: boolean;
  intrinsicValue: number;
  bid: number | null;
  ask: number | null;
  last: number | null;
  mark: number | null;
  bidSize: number | null;
  askSize: number | null;
  volume: number | null;
  openInterest: number | null;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  rho: number | null;
}

interface OptionsChainData {
  symbol: string;
  underlyingPrice: number | null;
  options: OptionContract[];
  totalContracts: number;
  nextUrl: string | null;
  source: string;
  timestamp: string;
}

export default function SPXOptionsChain() {
  const { user } = useAuth();
  const [contractType, setContractType] = useState<'ALL' | 'call' | 'put'>('ALL');
  const [sortField, setSortField] = useState<keyof OptionContract>('strike');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error, isError, refetch, isFetching } = useQuery<OptionsChainData>({
    queryKey: ['spx-options-chain', user?.ID, contractType],
    queryFn: async () => {
      const params: any = {
        limit: 100
      };
      
      if (contractType !== 'ALL') {
        params.contractType = contractType;
      }
      
      const { data, error } = await window.ezsite.apis.run({
        path: 'spxOptionsChainFetcher',
        methodName: 'fetchSPXOptionsChain',
        param: [params]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  const handleSort = (field: keyof OptionContract) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOptions = data?.options ? [...data.options].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  }) : [];

  const formatMoney = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number | null, decimals = 4) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load SPX options chain. Please check your API configuration.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.options || data.options.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No options data available. Please try refreshing or adjusting your filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                SPX Options Chain
              </h2>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Live</span>
              </div>
            </div>
            {data.underlyingPrice && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Underlying Price: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(data.underlyingPrice)}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {sortedOptions.length} of {data.totalContracts} contracts
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data.timestamp && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Updated: {format(new Date(data.timestamp), 'HH:mm:ss')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <Tabs value={contractType} onValueChange={(v) => setContractType(v as any)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="call">Calls</TabsTrigger>
              <TabsTrigger value="put">Puts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Options Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('expiration')}>
                    Expiration {sortField === 'expiration' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                    Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('strike')}>
                    Strike {sortField === 'strike' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Bid × Size</TableHead>
                  <TableHead className="text-right">Ask × Size</TableHead>
                  <TableHead className="text-right">Last</TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('volume')}>
                    Volume {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('openInterest')}>
                    OI {sortField === 'openInterest' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">ITM</TableHead>
                  <TableHead className="text-right">Intrinsic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOptions.map((option, idx) => (
                  <TableRow
                    key={`${option.symbol}-${idx}`}
                    className={option.inTheMoney ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                    <TableCell className="font-mono text-xs">
                      {option.expiration}
                      <div className="text-xs text-slate-500">{option.daysToExpiration}d</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={option.type === 'CALL' ? 'default' : 'destructive'}>
                        {option.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatMoney(option.strike)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(option.bid)}
                      {option.bidSize && <span className="text-xs text-slate-500 ml-1">×{option.bidSize}</span>}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(option.ask)}
                      {option.askSize && <span className="text-xs text-slate-500 ml-1">×{option.askSize}</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(option.last)}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.volume !== null ? option.volume.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {option.openInterest !== null ? option.openInterest.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {option.inTheMoney ? (
                        <Badge variant="default" className="bg-green-600">ITM</Badge>
                      ) : (
                        <Badge variant="outline">OTM</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(option.intrinsicValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Data source: <span className="font-semibold">{data.source}</span>
          </div>
          <div>
            Auto-refreshes every 30 seconds
          </div>
        </div>
      </div>
    </Card>
  );
}