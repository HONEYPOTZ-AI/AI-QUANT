// Calculate SPX major option expiration dates
export function getSPXExpirationDates() {
  try {
    const now = new Date();
    const expirations = [];

    // Calculate next 6 monthly expirations (3rd Friday of each month)
    for (let i = 0; i < 6; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const thirdFriday = getThirdFriday(targetMonth);
      
      if (thirdFriday > now) {
        expirations.push({
          date: thirdFriday.toISOString(),
          type: 'Monthly',
          isQuarterly: isQuarterlyMonth(thirdFriday.getMonth())
        });
      }
    }

    // Calculate next year's quarterly expirations if needed
    const nextYear = now.getFullYear() + 1;
    const quarterlyMonths = [2, 5, 8, 11]; // March, June, September, December (0-indexed)
    
    for (const month of quarterlyMonths) {
      const targetMonth = new Date(nextYear, month, 1);
      const thirdFriday = getThirdFriday(targetMonth);
      
      if (thirdFriday > now) {
        expirations.push({
          date: thirdFriday.toISOString(),
          type: 'Quarterly',
          isQuarterly: true
        });
      }
    }

    // Sort by date and return next 4
    const sortedExpirations = expirations
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);

    return sortedExpirations;
  } catch (error) {
    throw new Error(`Failed to calculate SPX expirations: ${error.message}`);
  }
}

// Get the third Friday of a given month
function getThirdFriday(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Start from the 1st of the month
  let day = new Date(year, month, 1);
  
  // Find the first Friday
  while (day.getDay() !== 5) {
    day.setDate(day.getDate() + 1);
  }
  
  // Add 14 days to get to the third Friday
  day.setDate(day.getDate() + 14);
  
  // Set time to market close (4:00 PM ET)
  day.setHours(16, 0, 0, 0);
  
  return day;
}

// Check if a month is a quarterly expiration month
function isQuarterlyMonth(month) {
  // March (2), June (5), September (8), December (11) - 0-indexed
  return [2, 5, 8, 11].includes(month);
}