import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Terminal, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function DebuggingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Debugging Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to debug:</strong> Open browser DevTools (F12 or Cmd+Option+I), then click the Console tab
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-green-900">Success Messages</div>
              <div className="text-xs text-green-700 mt-1">
                Look for ✅ symbols indicating successful API calls and cached data
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-blue-900">Info Messages</div>
              <div className="text-xs text-blue-700 mt-1">
                Look for 🔄 symbols showing when fresh data is being fetched
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-red-900">Error Messages</div>
              <div className="text-xs text-red-700 mt-1">
                Look for ❌ symbols with detailed error information
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="text-sm font-medium mb-2">Common Console Output:</div>
          <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-xs space-y-1">
            <div>✅ Returning cached SPX price data</div>
            <div>🔄 Fetching fresh SPX price from Polygon.io...</div>
            <div>✅ SPX price data cached successfully</div>
            <div>✅ Market overview data cached: 4 indices, 3 forex, 2 crypto</div>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>If you see API errors:</strong> Check that POLYGON_API_KEY is set in your .env file and that you have API access to indices data
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}