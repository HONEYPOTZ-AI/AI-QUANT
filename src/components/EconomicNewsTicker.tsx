import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface EconomicEvent {
  id: number;
  event_type: string;
  event_name: string;
  event_date: string;
  importance: string;
}

interface WhiteHouseAlert {
  id: number;
  alert_type: string;
  title: string;
  published_date: string;
  severity: string;
  is_live: boolean;
}

interface EconomicNews {
  id: number;
  headline: string;
  category: string;
  published_date: string;
  importance: string;
}

export default function EconomicNewsTicker() {
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  // Fetch economic events
  const { data: eventsData } = useQuery({
    queryKey: ['economicEvents'],
    queryFn: async () => {
      const result = await window.ezsite.apis.tablePage(58102, {
        PageNo: 1,
        PageSize: 20,
        OrderByField: 'event_date',
        IsAsc: true,
        Filters: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  // Fetch White House alerts
  const { data: alertsData } = useQuery({
    queryKey: ['whiteHouseAlerts'],
    queryFn: async () => {
      const result = await window.ezsite.apis.tablePage(58103, {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'published_date',
        IsAsc: false,
        Filters: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  });

  // Fetch economic news
  const { data: newsData } = useQuery({
    queryKey: ['economicNews'],
    queryFn: async () => {
      const result = await window.ezsite.apis.tablePage(58104, {
        PageNo: 1,
        PageSize: 15,
        OrderByField: 'published_date',
        IsAsc: false,
        Filters: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 3 * 60 * 1000 // Refresh every 3 minutes
  });

  // Combine and format ticker items
  useEffect(() => {
    const items: string[] = [];

    // Add economic events
    if (eventsData?.List) {
      eventsData.List.forEach((event: EconomicEvent) => {
        try {
          const dateStr = format(new Date(event.event_date), 'MMM dd, HH:mm');
          const color = getEventColor(event.event_type);
          items.push(
            `<span class="ticker-item font-semibold" style="color: ${color}">📊 ${event.event_type}: ${event.event_name} - ${dateStr}</span>`
          );
        } catch (e) {
          console.error('Error formatting event:', e);
        }
      });
    }

    // Add White House alerts
    if (alertsData?.List) {
      alertsData.List.forEach((alert: WhiteHouseAlert) => {
        const icon = alert.is_live ? '🔴 LIVE' : '🏛️';
        const color = alert.is_live ? '#ef4444' : '#8b5cf6';
        items.push(
          `<span class="ticker-item font-semibold" style="color: ${color}">${icon} ${alert.title}</span>`
        );
      });
    }

    // Add economic news
    if (newsData?.List) {
      newsData.List.slice(0, 10).forEach((news: EconomicNews) => {
        const color = getCategoryColor(news.category);
        items.push(
          `<span class="ticker-item font-semibold" style="color: ${color}">📰 ${news.headline}</span>`
        );
      });
    }

    if (items.length > 0) {
      // Duplicate items for seamless infinite scroll
      setTickerItems([...items, ...items, ...items]);
    } else {
      setTickerItems([
        '<span class="ticker-item font-semibold text-yellow-400">📊 Loading economic data...</span>',
        '<span class="ticker-item font-semibold text-blue-400">🔄 Fetching market updates...</span>',
        '<span class="ticker-item font-semibold text-green-400">📈 Real-time news loading...</span>'
      ]);
    }
  }, [eventsData, alertsData, newsData]);

  const getEventColor = (eventType: string): string => {
    const colors: {[key: string]: string} = {
      FOMC: '#ef4444',
      NFP: '#3b82f6',
      CPI: '#f97316',
      GDP: '#10b981',
      Unemployment: '#3b82f6',
      FedSpeech: '#dc2626'
    };
    return colors[eventType] || '#6b7280';
  };

  const getCategoryColor = (category: string): string => {
    const colors: {[key: string]: string} = {
      Markets: '#3b82f6',
      Policy: '#8b5cf6',
      Employment: '#06b6d4',
      Inflation: '#f59e0b',
      Trade: '#10b981',
      General: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-yellow-500/70 shadow-2xl shadow-yellow-500/20">
      <div className="relative h-10 overflow-hidden">
        <div
          className="ticker-scroll absolute whitespace-nowrap flex items-center h-full gap-8 px-4"
          dangerouslySetInnerHTML={{
            __html: tickerItems.join(
              '<span class="ticker-separator mx-6 text-yellow-500 text-xl">•</span>'
            )
          }}
        />
      </div>
      
      {/* Gradient fade edges for smooth visual effect */}
      <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
}