import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  error?: string;
  details?: string;
}

interface TestResultSummaryProps {
  results: TestResult[];
}

export default function TestResultSummary({ results }: TestResultSummaryProps) {
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const total = results.length;

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-6 w-6" />
              {passed}
            </div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-1">
              <XCircle className="h-6 w-6" />
              {failed}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          {failed === 0 ?
          <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">All tests passed successfully!</span>
            </div> :

          <div className="flex items-center justify-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Some tests failed - check details below</span>
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}