
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function EconomicDataRefreshTrigger() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Trigger backend data fetching periodically
  const { refetch: fetchEconomicCalendar } = useQuery({
    queryKey: ['triggerEconomicCalendar'],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'economicCalendarFetcher',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: false
  });

  const { refetch: fetchWhiteHouseAlerts } = useQuery({
    queryKey: ['triggerWhiteHouseMonitor'],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'whiteHouseMonitor',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: false
  });

  const { refetch: fetchEconomicNews } = useQuery({
    queryKey: ['triggerEconomicNews'],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'economicNewsFetcher',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: false
  });

  // Refresh data on mount and periodically
  useEffect(() => {
    // Initial fetch
    const performInitialFetch = async () => {
      try {
        await fetchEconomicCalendar();
        await fetchWhiteHouseAlerts();
        await fetchEconomicNews();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching economic data:', error);
      }
    };

    performInitialFetch();

    // Set up periodic refresh
    const calendarInterval = setInterval(async () => {
      try {
        await fetchEconomicCalendar();
      } catch (error) {
        console.error('Error refreshing economic calendar:', error);
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    const alertsInterval = setInterval(async () => {
      try {
        await fetchWhiteHouseAlerts();
      } catch (error) {
        console.error('Error refreshing White House alerts:', error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    const newsInterval = setInterval(async () => {
      try {
        await fetchEconomicNews();
      } catch (error) {
        console.error('Error refreshing economic news:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      clearInterval(calendarInterval);
      clearInterval(alertsInterval);
      clearInterval(newsInterval);
    };
  }, [fetchEconomicCalendar, fetchWhiteHouseAlerts, fetchEconomicNews]);

  return null; // This is a background component
}