import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface IndexData {
  price: number;
  change: number;
  percentChange: number;
  previousClose?: number;
}

interface SPXVIXData {
  spx: IndexData | null;
  vix: IndexData | null;
  source: string | null;
  timestamp: string;
}

export default function SPXVIXDisplay() {
  const { user } = useAuth();

  const { data, isLoading, error, isError } = useQuery<SPXVIXData>({
    queryKey: ['spx-vix-data', user?.ID],
    queryFn: async () => {
      const { data, error } = await window.ezsite.apis.run({
        path: 'spxVixDataFetcher',
        param: [user?.ID]
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!user?.ID,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });

  const renderIndexCard = (
    title: string,
    symbol: string,
    data: IndexData | null | undefined,
    icon: React.ReactNode
  ) => {
    if (!data) {
      return (
        <Card className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
            </div>
            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{symbol}</span>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
          </div>
        </Card>
      );
    }

    const isPositive = data.change >= 0;
    const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const bgColor = isPositive 
      ? 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950' 
      : 'from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950';
    const borderColor = isPositive 
      ? 'border-green-200 dark:border-green-800' 
      : 'border-red-200 dark:border-red-800';

    return (
      <Card className={`flex-1 p-6 bg-gradient-to-br ${bgColor} ${borderColor} border-2 transition-all duration-300 hover:shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
          </div>
          <span className="text-sm font-mono font-semibold text-slate-600 dark:text-slate-300">{symbol}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${changeColor} font-semibold`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg">
                {isPositive ? '+' : ''}{data.change.toFixed(2)}
              </span>
            </div>
            
            <div className={`px-3 py-1 rounded-full ${changeColor} ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              <span className="text-sm font-semibold">
                {isPositive ? '+' : ''}{data.percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Market Indices</h2>
        </div>
        <div className="flex gap-4">
          <Card className="flex-1 p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-6 w-24" />
          </Card>
          <Card className="flex-1 p-6">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-full mb-3" />
            <Skeleton className="h-6 w-24" />
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load market data. Please check your API configuration.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Market Indices</h2>
        </div>
        {data?.timestamp && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Last updated: {format(new Date(data.timestamp), 'HH:mm:ss')}
          </div>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        {renderIndexCard(
          'S&P 500 Index',
          'SPX',
          data?.spx,
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        )}
        {renderIndexCard(
          'Volatility Index',
          'VIX',
          data?.vix,
          <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </div>
      
      {data?.source && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
          Data source: {data.source === 'thinkorswim' ? 'ThinkorSwim' : 'FastAPI'}
        </div>
      )}
    </div>
  );
}