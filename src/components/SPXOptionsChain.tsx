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
  TableRow,
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
  bid: number;
  ask: number;
  last: number;
  mark: number;
  bidSize: number;
  askSize: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  inTheMoney: boolean;
}

interface OptionsChainData {
  symbol: string;
  underlyingPrice: number;
  options: OptionContract[];
  source: string;
  timestamp: string;
}

export default function SPXOptionsChain() {
  const { user } = useAuth();
  const [contractType, setContractType] = useState<'ALL' | 'CALL' | 'PUT'>('ALL');
  const [strikeCount, setStrikeCount] = useState(20);
  const [sortField, setSortField] = useState<keyof OptionContract>('strike');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error, isError, refetch } = useQuery<OptionsChainData>({
    queryKey: ['spx-options-chain', user?.ID, contractType, strikeCount],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.run({
        path: 'spxOptionsChainFetcher',
        methodName: 'fetchSPXOptionsChain',
        param: [user?.ID, { contractType, strikeCount }]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
    retry: 2
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
    const modifier = sortDirection === 'asc' ? 1 : -1;
    return aVal > bVal ? modifier : -modifier;
  }) : [];

  const formatMoney = (value: number) => {
    return value?.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals = 4) => {
    return value?.toFixed(decimals);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
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
          {error instanceof Error ? error.message : 'Failed to load options chain'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              SPX Options Chain
            </h2>
            {data?.underlyingPrice && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Underlying Price: <span className="font-semibold">{formatMoney(data.underlyingPrice)}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {data?.timestamp && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Updated: {format(new Date(data.timestamp), 'HH:mm:ss')}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Tabs value={contractType} onValueChange={(v) => setContractType(v as any)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="CALL">Calls</TabsTrigger>
              <TabsTrigger value="PUT">Puts</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Strikes:</span>
            {[10, 20, 30, 50].map((count) => (
              <Button
                key={count}
                variant={strikeCount === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStrikeCount(count)}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>

        {/* Options Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('expiration')}>
                    Expiration
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                    Type
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('strike')}>
                    Strike
                  </TableHead>
                  <TableHead className="text-right">Bid × Size</TableHead>
                  <TableHead className="text-right">Ask × Size</TableHead>
                  <TableHead className="text-right">Last</TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('volume')}>
                    Volume
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('openInterest')}>
                    OI
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort('impliedVolatility')}>
                    IV
                  </TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="text-right">Gamma</TableHead>
                  <TableHead className="text-right">Theta</TableHead>
                  <TableHead className="text-right">Vega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOptions.map((option, idx) => (
                  <TableRow
                    key={`${option.symbol}-${idx}`}
                    className={option.inTheMoney ? 'bg-green-50 dark:bg-green-950/20' : ''}
                  >
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
                      <span className="text-xs text-slate-500 ml-1">×{option.bidSize}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatMoney(option.ask)}
                      <span className="text-xs text-slate-500 ml-1">×{option.askSize}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(option.last)}
                    </TableCell>
                    <TableCell className="text-right">{option.volume?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{option.openInterest?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatPercent(option.impliedVolatility)}</TableCell>
                    <TableCell className={`text-right ${option.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatNumber(option.delta)}
                    </TableCell>
                    <TableCell className="text-right text-xs">{formatNumber(option.gamma)}</TableCell>
                    <TableCell className="text-right text-xs">{formatNumber(option.theta)}</TableCell>
                    <TableCell className="text-right text-xs">{formatNumber(option.vega)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {data?.source && (
          <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
            Data source: {data.source === 'thinkorswim' ? 'ThinkorSwim' : 'FastAPI'}
          </div>
        )}
      </div>
    </Card>
  );
}
