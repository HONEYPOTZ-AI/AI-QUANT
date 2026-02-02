import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface SPXPriceData {
  price: number;
  bid: number | null;
  ask: number | null;
  change: number;
  percentChange: number;
  volume: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
  vwap: number | null;
  transactions: number;
  source: string;
  timestamp: string;
  marketStatus?: 'open' | 'closed';
  isRealTime?: boolean;
}

export default function SPXVIXDisplay() {
  const { user } = useAuth();

  const { data, isLoading, error, isError, refetch, isFetching } = useQuery<SPXPriceData>({
    queryKey: ['spx-realtime-price'],
    queryFn: async () => {
      console.log('🔄 [SPXVIXDisplay] Fetching real-time SPX price...');
      try {
        const { data, error } = await window.ezsite.apis.run({
          path: 'spxRealTimePriceFetcher',
          methodName: 'fetchRealTimeSPXPrice',
          param: []
        });
        console.log('📊 [SPXVIXDisplay] API Response:', { data, error });

        if (error) {
          console.error('❌ [SPXVIXDisplay] Error from backend:', error);
          throw new Error(error);
        }

        console.log('✅ [SPXVIXDisplay] Successfully fetched SPX price:', data?.price);
        return data;
      } catch (err) {
        console.error('❌ [SPXVIXDisplay] Exception during fetch:', err);
        throw err;
      }
    },
    enabled: true, // Always enabled - no auth requirement
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });

  // Log state changes
  console.log('📈 [SPXVIXDisplay] Component state:', {
    isLoading,
    isFetching,
    hasData: !!data,
    hasError: !!error,
    errorMessage: error?.message
  });

  // Show toast notification on error
  useEffect(() => {
    if (error) {
      toast({
        title: 'SPX Price Update Failed',
        description: error instanceof Error ? error.message : 'Unable to fetch real-time SPX price data',
        variant: 'destructive'
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Live SPX Price</h2>
        </div>
        <Card className="p-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-16 w-full mb-3" />
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-6 w-32" />
        </Card>
      </div>);

  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load SPX price data. Please check your Polygon.io API configuration in the .env file.'}
        </AlertDescription>
      </Alert>);

  }

  if (!data) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No SPX price data available. Please try refreshing.
        </AlertDescription>
      </Alert>);

  }

  const isPositive = data.change >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColor = isPositive ?
  'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950' :
  'from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950';
  const borderColor = isPositive ?
  'border-green-200 dark:border-green-800' :
  'border-red-200 dark:border-red-800';

  const marketOpen = data.marketStatus === 'open';
  const isRealTime = data.isRealTime !== false;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">SPX Index Price</h2>
          {marketOpen && isRealTime ?
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live</span>
            </div> :

          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              <span>{marketOpen ? 'Delayed' : 'Market Closed'}</span>
            </div>
          }
        </div>
        <div className="flex items-center gap-3">
          {data.timestamp &&
          <div className="text-xs text-slate-500 dark:text-slate-400">
              Updated: {format(new Date(data.timestamp), 'HH:mm:ss')}
            </div>
          }
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data">

            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <Card className={`p-6 bg-gradient-to-br ${bgColor} ${borderColor} border-2 transition-all duration-300 hover:shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">S&P 500 Index</h3>
          </div>
          <span className="text-lg font-mono font-semibold text-slate-600 dark:text-slate-300">SPX</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
              {data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 ${changeColor} font-semibold`}>
              {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              <span className="text-2xl">
                {isPositive ? '+' : ''}{data.change.toFixed(2)}
              </span>
            </div>
            
            <div className={`px-4 py-2 rounded-full ${changeColor} ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <span className="text-lg font-semibold">
                {isPositive ? '+' : ''}{data.percentChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-300 dark:border-slate-600">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Previous Close</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.previousClose.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Open</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.open.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">High</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                {data.high.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Low</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {data.low.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Volume</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.volume?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">VWAP</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.vwap?.toFixed(2) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Transactions</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {data.transactions?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data Source</p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {data.source || 'N/A'}
              </p>
            </div>
          </div>

          {/* Market status notice */}
          {!marketOpen &&
          <Alert className="mt-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Market is currently closed. Showing {isRealTime ? 'last traded' : 'previous close'} prices. Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday.
              </AlertDescription>
            </Alert>
          }
        </div>
      </Card>
      
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
        {marketOpen ? 'Auto-refreshes every 30 seconds' : 'Updates when market opens'}
      </div>
    </div>);

}