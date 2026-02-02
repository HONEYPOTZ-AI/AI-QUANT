import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';

interface IntegrationStatus {
  spxPrice: {
    status: 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
  };
  marketData: {
    status: 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
  };
}

export default function PolygonIntegrationStatus() {
  const [status, setStatus] = useState<IntegrationStatus>({
    spxPrice: { status: 'loading' },
    marketData: { status: 'loading' }
  });

  useEffect(() => {
    const checkIntegration = async () => {
      // Test SPX Price
      try {
        const result = await window.ezsite.apis.run({
          path: 'spxRealTimePriceFetcher',
          methodName: 'fetchRealTimeSPXPrice',
          param: []
        });

        if (result.error) {
          setStatus(prev => ({
            ...prev,
            spxPrice: { status: 'error', error: result.error }
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            spxPrice: { status: 'success', data: result.data }
          }));
        }
      } catch (error: any) {
        setStatus(prev => ({
          ...prev,
          spxPrice: { status: 'error', error: error.message }
        }));
      }

      // Test Market Data
      try {
        const result = await window.ezsite.apis.run({
          path: 'polygonMarketDataFetcher',
          methodName: 'getMarketOverviewData',
          param: []
        });

        if (result.error) {
          setStatus(prev => ({
            ...prev,
            marketData: { status: 'error', error: result.error }
          }));
        } else {
          setStatus(prev => ({
            ...prev,
            marketData: { status: 'success', data: result.data }
          }));
        }
      } catch (error: any) {
        setStatus(prev => ({
          ...prev,
          marketData: { status: 'error', error: error.message }
        }));
      }
    };

    checkIntegration();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loading':
        return 'Checking...';
      case 'success':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const allSuccess = status.spxPrice.status === 'success' && status.marketData.status === 'success';
  const hasErrors = status.spxPrice.status === 'error' || status.marketData.status === 'error';

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Polygon API Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* SPX Price Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.spxPrice.status)}
            <span className="text-sm font-medium">SPX Real-time Price</span>
          </div>
          <Badge variant={status.spxPrice.status === 'success' ? 'default' : status.spxPrice.status === 'error' ? 'destructive' : 'secondary'}>
            {getStatusText(status.spxPrice.status)}
          </Badge>
        </div>

        {status.spxPrice.status === 'success' && status.spxPrice.data && (
          <div className="pl-6 text-xs text-muted-foreground">
            Price: ${status.spxPrice.data.price?.toFixed(2)} | Change: {status.spxPrice.data.change >= 0 ? '+' : ''}{status.spxPrice.data.change?.toFixed(2)} ({status.spxPrice.data.percentChange?.toFixed(2)}%)
          </div>
        )}

        {status.spxPrice.error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{status.spxPrice.error}</AlertDescription>
          </Alert>
        )}

        {/* Market Data Status */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.marketData.status)}
            <span className="text-sm font-medium">Market Overview Data</span>
          </div>
          <Badge variant={status.marketData.status === 'success' ? 'default' : status.marketData.status === 'error' ? 'destructive' : 'secondary'}>
            {getStatusText(status.marketData.status)}
          </Badge>
        </div>

        {status.marketData.status === 'success' && status.marketData.data && (
          <div className="pl-6 text-xs text-muted-foreground">
            Indices: {status.marketData.data.indices?.length || 0} | Forex: {status.marketData.data.forex?.length || 0} | Crypto: {status.marketData.data.crypto?.length || 0}
          </div>
        )}

        {status.marketData.error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{status.marketData.error}</AlertDescription>
          </Alert>
        )}

        {/* Overall Status */}
        <div className="pt-2 border-t">
          {allSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              All systems operational
            </div>
          )}
          {hasErrors && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <XCircle className="h-4 w-4" />
              Integration issues detected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}