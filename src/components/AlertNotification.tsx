
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';

interface WhiteHouseAlert {
  id: number;
  alert_type: string;
  title: string;
  description: string;
  published_date: string;
  severity: string;
  is_live: boolean;
  source_url: string;
  notified: boolean;
}

export default function AlertNotification() {
  const [criticalAlert, setCriticalAlert] = useState<WhiteHouseAlert | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());

  // Fetch alerts with short polling interval
  const { data: alertsData } = useQuery({
    queryKey: ['whiteHouseAlertsForNotification'],
    queryFn: async () => {
      const result = await window.ezsite.apis.tablePage(58103, {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'published_date',
        IsAsc: false,
        Filters: [
        { name: 'notified', op: 'Equal', value: false }]

      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 30 * 1000 // Check every 30 seconds for new alerts
  });

  // Process new alerts
  useEffect(() => {
    if (!alertsData?.List) return;

    alertsData.List.forEach(async (alert: WhiteHouseAlert) => {
      // Skip if already notified
      if (notifiedIds.has(alert.id)) return;

      // Add to notified set
      setNotifiedIds((prev) => new Set(prev).add(alert.id));

      // Show notification based on severity
      if (alert.severity === 'Critical' || alert.is_live) {
        // Show modal for critical alerts or live events
        setCriticalAlert(alert);
      } else if (alert.severity === 'High') {
        // Show prominent toast for high severity
        toast({
          title: `🚨 ${alert.alert_type}: ${alert.title}`,
          description: alert.description,
          duration: 10000,
          variant: 'destructive'
        });
      } else {
        // Show normal toast for medium/low severity
        toast({
          title: `🏛️ ${alert.alert_type}: ${alert.title}`,
          description: alert.description,
          duration: 7000
        });
      }

      // Mark as notified in database
      try {
        await window.ezsite.apis.tableUpdate(58103, {
          id: alert.id,
          notified: true
        });
      } catch (error) {
        console.error('Error updating notification status:', error);
      }
    });
  }, [alertsData, notifiedIds]);

  const handleCloseCriticalAlert = () => {
    setCriticalAlert(null);
  };

  const handleViewSource = () => {
    if (criticalAlert?.source_url) {
      window.open(criticalAlert.source_url, '_blank');
    }
    setCriticalAlert(null);
  };

  return (
    <AlertDialog open={!!criticalAlert} onOpenChange={handleCloseCriticalAlert}>
      <AlertDialogContent className="border-2 border-red-500 bg-gradient-to-br from-red-950 to-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
            {criticalAlert?.is_live &&
            <span className="flex items-center gap-1 animate-pulse">
                🔴 LIVE
              </span>
            }
            {!criticalAlert?.is_live && '🚨'}
            {criticalAlert?.alert_type}: CRITICAL ALERT
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white text-lg mt-4">
            <div className="font-semibold mb-2">{criticalAlert?.title}</div>
            <div className="text-gray-300">{criticalAlert?.description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleCloseCriticalAlert} className="bg-gray-600 hover:bg-gray-700">
            Dismiss
          </AlertDialogAction>
          {criticalAlert?.source_url &&
          <AlertDialogAction onClick={handleViewSource} className="bg-red-600 hover:bg-red-700">
              View Source
            </AlertDialogAction>
          }
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);

}