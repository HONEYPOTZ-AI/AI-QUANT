import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUp, ArrowDown, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function SPXPriceHeader() {
  const { user } = useAuth();

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['spx-realtime-price', user?.ID],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'spxRealTimePriceFetcher',
        methodName: 'fetchRealTimeSPXPrice',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user?.ID,
    refetchInterval: 30000,
    staleTime: 25000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load SPX price: {error.message}
        </AlertDescription>
      </Alert>);

  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>No SPX price data available</AlertDescription>
      </Alert>);

  }

  const isPositive = (data.change || 0) >= 0;
  const ChangeIcon = isPositive ? ArrowUp : ArrowDown;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBgColor = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">S&P 500 Index</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">SPX</span>
            <span>•</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${data.marketStatus === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${data.marketStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {data.marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data.isRealTime ? 'Real-time' : 'Delayed'}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2">

          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Price Display */}
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold tracking-tight">
              {data.price?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className={`flex items-center gap-2 pb-2 ${changeColor}`}>
              <ChangeIcon className="h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-semibold">
                  {isPositive ? '+' : ''}{data.change?.toFixed(2)}
                </span>
                <span className="text-lg font-medium">
                  ({isPositive ? '+' : ''}{data.percentChange?.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className={`p-4 rounded-lg ${changeBgColor}`}>
              <div className="text-xs text-muted-foreground mb-1">Open</div>
              <div className="text-lg font-semibold">
                {data.open?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="text-xs text-muted-foreground mb-1">High</div>
              <div className="text-lg font-semibold text-blue-700">
                {data.high?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-orange-50">
              <div className="text-xs text-muted-foreground mb-1">Low</div>
              <div className="text-lg font-semibold text-orange-700">
                {data.low?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-muted-foreground mb-1">Previous Close</div>
              <div className="text-lg font-semibold">
                {data.previousClose?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-xs text-muted-foreground mb-1">Volume</div>
              <div className="text-lg font-semibold text-purple-700">
                {data.volume ? (data.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
              </div>
            </div>

            {data.vwap &&
            <div className="p-4 rounded-lg bg-indigo-50">
                <div className="text-xs text-muted-foreground mb-1">VWAP</div>
                <div className="text-lg font-semibold text-indigo-700">
                  {data.vwap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            }
          </div>

          {/* Timestamp */}
          {data.timestamp &&
          <div className="text-xs text-muted-foreground text-right">
              Last updated: {format(new Date(data.timestamp), 'PPpp')}
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}