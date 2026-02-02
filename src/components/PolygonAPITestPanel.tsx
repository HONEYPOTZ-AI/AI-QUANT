import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Play, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  error?: string;
  data?: any;
  fetchTime?: string;
  details?: string;
}

export default function PolygonAPITestPanel() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    timestamp?: string;
    apiKeyConfigured?: boolean;
    tests?: TestResult[];
    summary?: {
      total: number;
      passed: number;
      failed: number;
    };
  }>({});
  const { toast } = useToast();

  const runTests = async () => {
    setTesting(true);
    setResults({});

    try {
      const result = await window.ezsite.apis.run({
        path: 'verifyPolygonIntegration',
        methodName: 'verifyPolygonAPIIntegration',
        param: []
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setResults(result.data);

      if (result.data.summary?.failed === 0) {
        toast({
          title: '✅ All Tests Passed',
          description: 'Polygon API integration is working correctly.',
        });
      } else {
        toast({
          title: '⚠️ Some Tests Failed',
          description: `${result.data.summary?.failed} out of ${result.data.summary?.total} tests failed.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message,
        variant: 'destructive',
      });
      setResults({
        tests: [{
          name: 'Test Execution',
          status: 'FAILED',
          error: error.message
        }]
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Polygon API Integration Test</CardTitle>
            <CardDescription>
              Verify that the Polygon.io API key is properly configured and all endpoints are working
            </CardDescription>
          </div>
          <Button
            onClick={runTests}
            disabled={testing}
            size="lg"
            className="gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Verification
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Status */}
        {results.apiKeyConfigured !== undefined && (
          <Alert className={results.apiKeyConfigured ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className="flex items-center gap-2">
              {results.apiKeyConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">API Key Configured</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium">API Key Not Found - Please add POLYGON_API_KEY to .env file</span>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        {results.summary && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{results.summary.total}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Tests</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{results.summary.passed}</div>
                  <div className="text-sm text-muted-foreground mt-1">Passed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{results.summary.failed}</div>
                  <div className="text-sm text-muted-foreground mt-1">Failed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {results.tests && results.tests.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {results.tests.map((test, index) => (
              <Card key={index} className={`border-2 ${getStatusColor(test.status)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(test.status)}
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{test.name}</div>
                        {test.details && (
                          <div className="text-sm text-muted-foreground mb-2">{test.details}</div>
                        )}
                        {test.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertDescription className="text-sm">{test.error}</AlertDescription>
                          </Alert>
                        )}
                        {test.data && (
                          <div className="mt-2 p-3 bg-white/50 rounded border text-xs font-mono">
                            <pre>{JSON.stringify(test.data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.fetchTime && (
                        <Badge variant="outline" className="text-xs">
                          {test.fetchTime}
                        </Badge>
                      )}
                      <Badge 
                        variant={test.status === 'PASSED' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        {!results.tests && !testing && (
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Click "Run Verification" to test:</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>API key configuration</li>
                  <li>SPX real-time price fetching</li>
                  <li>Market overview data</li>
                  <li>SPX options chain fetching</li>
                  <li>Cache mechanism</li>
                  <li>Error handling</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Timestamp */}
        {results.timestamp && (
          <div className="text-xs text-muted-foreground text-right">
            Test completed at: {new Date(results.timestamp).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}