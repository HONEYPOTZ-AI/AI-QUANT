import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface PythonServiceSyncProps {
  enabled?: boolean;
  interval?: number; // milliseconds
  strategyIds?: number[];
}

export default function PythonServiceSync({
  enabled = true,
  interval = 30000,
  strategyIds = []
}: PythonServiceSyncProps) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!enabled) return;

    const syncData = async () => {
      try {
        console.log('[PythonServiceSync] Syncing data with Python service...');

        // Sync strategy updates
        if (strategyIds.length > 0) {
          for (const strategyId of strategyIds) {
            const result = await window.ezsite.apis.run({
              path: 'ironCondorPythonIntegration',
              methodName: 'updateStrategyWithPython',
              param: [strategyId]
            });

            if (result.error) {
              console.warn(`[PythonServiceSync] Failed to sync strategy ${strategyId}:`, result.error);
            }
          }

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['iron-condor-active'] });
          queryClient.invalidateQueries({ queryKey: ['iron-condor-performance'] });
        }

        lastSyncRef.current = new Date();
        console.log('[PythonServiceSync] Sync completed');
      } catch (error) {
        console.error('[PythonServiceSync] Sync error:', error);
      }
    };

    // Initial sync
    syncData();

    // Set up interval
    intervalRef.current = setInterval(syncData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, strategyIds, queryClient]);

  return null; // This is a headless component
}