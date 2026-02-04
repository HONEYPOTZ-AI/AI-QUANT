import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface EconomicEvent {
  event_type: string;
  event_name: string;
  event_date: string;
  importance: string;
  importance_score?: number;
}

interface SPXExpiration {
  date: string;
  type: string;
  isQuarterly: boolean;
}

interface TickerItem {
  text: string;
  color: string;
  type: 'event' | 'expiration';
  date: Date;
}

export default function EconomicNewsTicker() {
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  // Fetch upcoming economic events from backend
  const { data: eventsData } = useQuery({
    queryKey: ['upcomingEconomicEvents'],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'economicCalendarFetcher',
        methodName: 'getUpcomingEconomicEvents',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  });

  // Fetch SPX option expiration dates from backend
  const { data: expirationsData } = useQuery({
    queryKey: ['spxExpirations'],
    queryFn: async () => {
      const result = await window.ezsite.apis.run({
        path: 'spxOptionExpirations',
        methodName: 'getSPXExpirationDates',
        param: []
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60 * 60 * 1000 // Refresh every hour
  });

  // Helper function to calculate countdown
  const getCountdown = (targetDate: Date): string => {
    const now = new Date();
    const days = differenceInDays(targetDate, now);
    const hours = differenceInHours(targetDate, now);
    const minutes = differenceInMinutes(targetDate, now);

    if (days > 1) {
      return `in ${days} days`;
    } else if (days === 1) {
      return `in 1 day`;
    } else if (hours > 1) {
      return `in ${hours} hours`;
    } else if (hours === 1) {
      return `in 1 hour`;
    } else if (minutes > 0) {
      return `in ${minutes} min`;
    } else {
      return 'now';
    }
  };

  // Helper function to get event color
  const getEventColor = (eventType: string): string => {
    const colors: {[key: string]: string} = {
      FOMC: '#FF0000',      // Bright red
      NFP: '#00FF00',       // Bright green
      CPI: '#FFA500',       // Orange
      GDP: '#00FFFF',       // Cyan
      PPI: '#FFFF00',       // Yellow
      FedSpeech: '#FF0000'
    };
    return colors[eventType] || '#FFFFFF';
  };

  // Combine and format ticker items
  useEffect(() => {
    const items: TickerItem[] = [];

    // Add economic events
    if (eventsData && Array.isArray(eventsData)) {
      eventsData.forEach((event: EconomicEvent) => {
        try {
          const eventDate = new Date(event.event_date);
          const dateStr = format(eventDate, 'MMM dd, HH:mm');
          const countdown = getCountdown(eventDate);
          const color = getEventColor(event.event_type);
          
          items.push({
            text: `📊 ${event.event_type}: ${event.event_name} - ${dateStr} (${countdown})`,
            color: color,
            type: 'event',
            date: eventDate
          });
        } catch (e) {
          console.error('Error formatting event:', e);
        }
      });
    }

    // Add SPX option expirations
    if (expirationsData && Array.isArray(expirationsData)) {
      expirationsData.forEach((expiration: SPXExpiration) => {
        try {
          const expirationDate = new Date(expiration.date);
          const dateStr = format(expirationDate, 'MMM dd');
          const countdown = getCountdown(expirationDate);
          const color = expiration.isQuarterly ? '#FF00FF' : '#00FFFF'; // Magenta for quarterly, cyan for monthly
          const icon = expiration.isQuarterly ? '🔷' : '📅';
          
          items.push({
            text: `${icon} ${expiration.type} SPX Expiry - ${dateStr} (${countdown})`,
            color: color,
            type: 'expiration',
            date: expirationDate
          });
        } catch (e) {
          console.error('Error formatting expiration:', e);
        }
      });
    }

    if (items.length > 0) {
      // Sort by date
      items.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Alternate between events and expirations for better visual flow
      const events = items.filter(item => item.type === 'event');
      const expirations = items.filter(item => item.type === 'expiration');
      const alternated: TickerItem[] = [];
      
      const maxLength = Math.max(events.length, expirations.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < events.length) alternated.push(events[i]);
        if (i < expirations.length) alternated.push(expirations[i]);
      }

      // Format as HTML strings
      const formattedItems = alternated.map(item => 
        `<span class="ticker-item font-semibold" style="color: ${item.color}">${item.text}</span>`
      );

      // Duplicate items for seamless infinite scroll
      setTickerItems([...formattedItems, ...formattedItems, ...formattedItems]);
    } else {
      setTickerItems([
        '<span class="ticker-item font-semibold text-yellow-400">📊 Loading upcoming economic events...</span>',
        '<span class="ticker-item font-semibold text-cyan-400">📅 Loading SPX expiration dates...</span>',
        '<span class="ticker-item font-semibold text-green-400">🔄 Real-time data loading...</span>'
      ]);
    }
  }, [eventsData, expirationsData]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b-2 border-yellow-500/70 shadow-2xl shadow-yellow-500/20">
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