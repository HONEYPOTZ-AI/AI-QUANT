
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

interface TrumpTweet {
  id: number;
  tweet_id: string;
  content: string;
  posted_at: string;
  retweet_count: number;
  like_count: number;
  reply_count: number;
  url: string;
  is_important: boolean;
  notified?: boolean;
}

type CriticalAlert = WhiteHouseAlert | (TrumpTweet & { isTweet: true });

export default function AlertNotification() {
  const [criticalAlert, setCriticalAlert] = useState<CriticalAlert | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [notifiedTweetIds, setNotifiedTweetIds] = useState<Set<number>>(new Set());

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

  // Fetch important Trump tweets
  const { data: tweetsData } = useQuery({
    queryKey: ['trumpTweetsForNotification'],
    queryFn: async () => {
      const result = await window.ezsite.apis.tablePage(73738, {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'posted_at',
        IsAsc: false,
        Filters: [
          { name: 'is_important', op: 'Equal', value: true }
        ]
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60 * 1000 // Check every 60 seconds for new tweets
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

  // Process important Trump tweets
  useEffect(() => {
    if (!tweetsData?.List) return;

    tweetsData.List.forEach(async (tweet: TrumpTweet) => {
      // Skip if already notified
      if (notifiedTweetIds.has(tweet.id)) return;

      // Add to notified set
      setNotifiedTweetIds((prev) => new Set(prev).add(tweet.id));

      // Show modal for important tweets
      const tweetAlert: TrumpTweet & { isTweet: true } = { ...tweet, isTweet: true };
      setCriticalAlert(tweetAlert);

      // Show toast notification
      toast({
        title: `𝕏 TRUMP: Important Tweet`,
        description: tweet.content.substring(0, 150) + (tweet.content.length > 150 ? '...' : ''),
        duration: 10000,
        variant: 'destructive'
      });
    });
  }, [tweetsData, notifiedTweetIds]);

  const handleCloseCriticalAlert = () => {
    setCriticalAlert(null);
  };

  const handleViewSource = () => {
    if (criticalAlert) {
      const url = 'isTweet' in criticalAlert ? criticalAlert.url : criticalAlert.source_url;
      if (url) {
        window.open(url, '_blank');
      }
    }
    setCriticalAlert(null);
  };

  const isTweetAlert = criticalAlert && 'isTweet' in criticalAlert;

  return (
    <AlertDialog open={!!criticalAlert} onOpenChange={handleCloseCriticalAlert}>
      <AlertDialogContent className={`border-2 ${isTweetAlert ? 'border-cyan-400 bg-gradient-to-br from-cyan-950 to-slate-900' : 'border-red-500 bg-gradient-to-br from-red-950 to-slate-900'}`}>
        <AlertDialogHeader>
          <AlertDialogTitle className={`text-2xl font-bold ${isTweetAlert ? 'text-cyan-400' : 'text-red-400'} flex items-center gap-2`}>
            {isTweetAlert ? (
              <>
                <span className="flex items-center gap-1 animate-pulse">
                  𝕏 TRUMP
                </span>
                : IMPORTANT TWEET
              </>
            ) : (
              <>
                {(criticalAlert as WhiteHouseAlert)?.is_live &&
                <span className="flex items-center gap-1 animate-pulse">
                    🔴 LIVE
                  </span>
                }
                {!(criticalAlert as WhiteHouseAlert)?.is_live && '🚨'}
                {(criticalAlert as WhiteHouseAlert)?.alert_type}: CRITICAL ALERT
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white text-lg mt-4">
            {isTweetAlert ? (
              <>
                <div className="font-semibold mb-4 text-cyan-300">
                  {(criticalAlert as TrumpTweet & { isTweet: true }).content}
                </div>
                <div className="flex gap-4 text-sm text-gray-300">
                  <span>👍 {(criticalAlert as TrumpTweet & { isTweet: true }).like_count.toLocaleString()}</span>
                  <span>🔁 {(criticalAlert as TrumpTweet & { isTweet: true }).retweet_count.toLocaleString()}</span>
                  <span>💬 {(criticalAlert as TrumpTweet & { isTweet: true }).reply_count.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date((criticalAlert as TrumpTweet & { isTweet: true }).posted_at).toLocaleString()}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold mb-2">{(criticalAlert as WhiteHouseAlert)?.title}</div>
                <div className="text-gray-300">{(criticalAlert as WhiteHouseAlert)?.description}</div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleCloseCriticalAlert} className="bg-gray-600 hover:bg-gray-700">
            Dismiss
          </AlertDialogAction>
          {((isTweetAlert && (criticalAlert as TrumpTweet & { isTweet: true }).url) || 
            (!isTweetAlert && (criticalAlert as WhiteHouseAlert)?.source_url)) &&
          <AlertDialogAction onClick={handleViewSource} className={isTweetAlert ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-red-600 hover:bg-red-700'}>
              View on {isTweetAlert ? '𝕏' : 'Source'}
            </AlertDialogAction>
          }
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);

}