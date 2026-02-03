import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VerificationResult {
  exists: boolean;
  length: number;
  masked: string | null;
  message: string;
}

export default function EnvVerification() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const verifyEnvironment = async () => {
    setLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.run({
        path: 'envVerification',
        methodName: 'verifyPolygonApiKey',
        param: []
      });

      if (error) {
        toast({
          title: 'Verification Failed',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      setResult(data);
      setLastChecked(new Date());
      
      toast({
        title: data.exists ? 'Environment Verified' : 'Configuration Issue',
        description: data.message,
        variant: data.exists ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Error verifying environment:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify environment configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyEnvironment();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle>Environment Configuration</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={verifyEnvironment}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verify
          </Button>
        </div>
        <CardDescription>
          Verify that environment variables are properly configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            {/* .env Configuration Status */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              {result.exists ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  .env File Configuration
                </h3>
                <p className="text-sm text-muted-foreground">
                  {result.exists 
                    ? '✓ Environment file is properly configured' 
                    : '✗ Environment file not configured or missing variables'}
                </p>
              </div>
            </div>

            {/* POLYGON_API_KEY Status */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              {result.exists ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  POLYGON_API_KEY Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  {result.exists 
                    ? `✓ API key found (${result.length} characters)` 
                    : '✗ API key not found in environment variables'}
                </p>
              </div>
            </div>

            {/* Masked API Key */}
            {result.exists && result.masked && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">
                    Masked API Key
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {result.masked}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (First 4 and last 4 characters shown for security)
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Instructions */}
            {!result.exists && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-200 mb-2">
                  Configuration Required
                </h4>
                <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                  <li>Create a <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env</code> file in your project root</li>
                  <li>Add: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">POLYGON_API_KEY=your_api_key_here</code></li>
                  <li>Restart the application to load environment variables</li>
                </ol>
              </div>
            )}

            {/* Last Checked */}
            {lastChecked && (
              <p className="text-xs text-muted-foreground text-center">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
