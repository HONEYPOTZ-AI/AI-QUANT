import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Server } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PythonServiceStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['python-service-status'],
    queryFn: async () => {
      try {
        const result = await window.ezsite.apis.run({
          path: 'pythonServiceBridge',
          methodName: 'testPythonServiceConnection',
          param: []
        });

        if (result.error) throw new Error(result.error);
        return result.data;
      } catch (error) {
        return { status: 'disconnected', error: error };
      }
    },
    refetchInterval: 60000, // Check every minute
    retry: false
  });

  const isConnected = data?.status === 'connected';
  const StatusIcon = isLoading ? Loader2 : isConnected ? CheckCircle : XCircle;
  const statusColor = isLoading ? 'blue' : isConnected ? 'green' : 'red';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center gap-1.5 bg-${statusColor}-500/10 text-${statusColor}-500 border-${statusColor}-500/20 cursor-help`}>

            <Server className="h-3 w-3" />
            <StatusIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Checking...' : isConnected ? 'Python Service' : 'Service Offline'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-sm">
            <div className="font-semibold">
              {isConnected ? 'Python FastAPI Service Connected' : 'Python FastAPI Service Unavailable'}
            </div>
            {data?.serviceInfo &&
            <>
                <div className="text-xs text-muted-foreground">
                  Version: {data.serviceInfo.version}
                </div>
                <div className="text-xs text-muted-foreground">
                  URL: {data.serviceUrl}
                </div>
              </>
            }
            {!isConnected &&
            <div className="text-xs text-amber-500">
                Enhanced analytics unavailable
              </div>
            }
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>);

}