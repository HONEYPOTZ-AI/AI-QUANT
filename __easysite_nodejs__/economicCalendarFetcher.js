
// Fetch upcoming high-importance economic events (next 7-14 days)
export function getUpcomingEconomicEvents() {
  try {
    const now = new Date();
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead

    // Generate upcoming economic events (typical schedule)
    const upcomingEvents = [
      {
        event_type: 'FOMC',
        event_name: 'FOMC Meeting Decision',
        event_date: getNextFOMCDate(),
        description: 'Federal Open Market Committee policy meeting and interest rate decision',
        importance: 'High',
        importance_score: 10,
        source_url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm'
      },
      {
        event_type: 'NFP',
        event_name: 'Non-Farm Payrolls',
        event_date: getNextNFPDate(),
        description: 'Monthly employment report showing job creation and unemployment rate',
        importance: 'High',
        importance_score: 10,
        source_url: 'https://www.bls.gov/news.release/empsit.toc.htm'
      },
      {
        event_type: 'CPI',
        event_name: 'Consumer Price Index',
        event_date: getNextCPIDate(),
        description: 'Monthly inflation report measuring changes in consumer prices',
        importance: 'High',
        importance_score: 10,
        source_url: 'https://www.bls.gov/news.release/cpi.toc.htm'
      },
      {
        event_type: 'GDP',
        event_name: 'GDP Growth Rate',
        event_date: getNextGDPDate(),
        description: 'Quarterly economic growth rate report',
        importance: 'High',
        importance_score: 9,
        source_url: 'https://www.bea.gov/data/gdp/gross-domestic-product'
      },
      {
        event_type: 'PPI',
        event_name: 'Producer Price Index',
        event_date: getNextPPIDate(),
        description: 'Monthly wholesale inflation report',
        importance: 'High',
        importance_score: 8,
        source_url: 'https://www.bls.gov/ppi/'
      }
    ];

    // Filter events within next 7-14 days and high importance only
    const filteredEvents = upcomingEvents
      .filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate >= now && eventDate <= endDate && event.importance === 'High';
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.importance_score - a.importance_score;
      });

    return filteredEvents;
  } catch (error) {
    throw new Error(`Failed to get upcoming events: ${error.message}`);
  }
}

async function economicCalendarFetcher() {
  try {
    const events = getUpcomingEconomicEvents();

    // Save events to database
    for (const event of events) {
      // Check if event already exists
      const { data: existing } = await easysite.table.page(58102, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: 'event_name', op: 'Equal', value: event.event_name },
          { name: 'event_date', op: 'Equal', value: event.event_date }
        ]
      });

      if (!existing || existing.List.length === 0) {
        await easysite.table.create(58102, event);
      }
    }

    return { success: true, eventsAdded: events.length };

  } catch (error) {
    throw new Error(`Failed to fetch economic calendar: ${error.message}`);
  }
}

// Helper functions to calculate next event dates
function getNextFOMCDate() {
  // FOMC meets 8 times per year, roughly every 6 weeks
  const now = new Date();
  const fomcDates2024 = [
  new Date('2024-12-18T14:00:00'),
  new Date('2025-01-29T14:00:00'),
  new Date('2025-03-19T14:00:00'),
  new Date('2025-05-07T14:00:00'),
  new Date('2025-06-18T14:00:00'),
  new Date('2025-07-30T14:00:00'),
  new Date('2025-09-17T14:00:00'),
  new Date('2025-11-05T14:00:00'),
  new Date('2025-12-17T14:00:00')];


  for (const date of fomcDates2024) {
    if (date > now) return date.toISOString();
  }
  return new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
}

function getNextNFPDate() {
  // NFP is released first Friday of each month at 8:30 AM ET
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Find first Friday
  while (nextMonth.getDay() !== 5) {
    nextMonth.setDate(nextMonth.getDate() + 1);
  }
  nextMonth.setHours(8, 30, 0, 0);

  return nextMonth.toISOString();
}

function getNextCPIDate() {
  // CPI is released around 13th-15th of each month at 8:30 AM ET
  const now = new Date();
  let nextRelease = new Date(now.getFullYear(), now.getMonth(), 13, 8, 30, 0, 0);

  if (nextRelease <= now) {
    nextRelease = new Date(now.getFullYear(), now.getMonth() + 1, 13, 8, 30, 0, 0);
  }

  return nextRelease.toISOString();
}

function getNextGDPDate() {
  // GDP is released quarterly (last week of Jan, Apr, Jul, Oct)
  const now = new Date();
  const gdpMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct

  for (const month of gdpMonths) {
    const gdpDate = new Date(now.getFullYear(), month, 25, 8, 30, 0, 0);
    if (gdpDate > now) return gdpDate.toISOString();
  }

  return new Date(now.getFullYear() + 1, 0, 25, 8, 30, 0, 0).toISOString();
}

function getNextUnemploymentDate() {
  // Unemployment claims every Thursday at 8:30 AM ET
  const now = new Date();
  const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
  const nextThursday = new Date(now.getTime() + daysUntilThursday * 24 * 60 * 60 * 1000);
  nextThursday.setHours(8, 30, 0, 0);

  return nextThursday.toISOString();
}

function getNextPPIDate() {
  // PPI is released around 14th-16th of each month at 8:30 AM ET
  const now = new Date();
  let nextRelease = new Date(now.getFullYear(), now.getMonth(), 14, 8, 30, 0, 0);

  if (nextRelease <= now) {
    nextRelease = new Date(now.getFullYear(), now.getMonth() + 1, 14, 8, 30, 0, 0);
  }

  return nextRelease.toISOString();
}

module.exports = economicCalendarFetcher;