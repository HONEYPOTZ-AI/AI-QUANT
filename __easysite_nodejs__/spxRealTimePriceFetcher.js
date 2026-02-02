/**
 * Real-time SPX Price Fetcher
 * Fetches live SPX index price from Polygon.io API using Snapshot endpoint
 */

const CACHE_DURATION = 5000; // Cache for 5 seconds
let priceCache = null;
let lastFetchTime = 0;

/**
 * Fetch real-time SPX price
 * @returns {Object} SPX price data with timestamp
 */
export async function fetchRealTimeSPXPrice() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (priceCache && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('✅ [SPX Fetcher] Returning cached SPX price data');
      return priceCache;
    }

    console.log('🔄 [SPX Fetcher] Fetching fresh SPX price from Polygon.io...');

    // Fetch from Polygon.io
    const priceData = await fetchFromPolygon();

    if (!priceData) {
      throw new Error('Unable to fetch SPX price from Polygon.io');
    }

    // Cache the result
    priceCache = {
      ...priceData,
      timestamp: new Date().toISOString()
    };
    lastFetchTime = now;

    console.log('✅ [SPX Fetcher] SPX price cached successfully:', priceData.price);
    return priceCache;
  } catch (error) {
    console.error('❌ [SPX Fetcher] Error fetching real-time SPX price:', error);
    throw new Error(`Failed to fetch SPX price: ${error.message}`);
  }
}

/**
 * Check if market is open (approximate - US market hours)
 */
function isMarketOpen() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();
  const time = hour * 60 + minute;

  // Monday-Friday
  if (day === 0 || day === 6) return false;
  
  // 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM
  
  return time >= marketOpen && time < marketClose;
}

/**
 * Fetch SPX price from Polygon.io using multiple endpoints for best data
 */
async function fetchFromPolygon() {
  try {
    const apiKey = Deno.env.get('POLYGON_API_KEY');
    
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not found in environment variables. Please add it to your .env file.');
    }

    const axios = (await import('npm:axios@1.7.9')).default;
    
    const marketOpen = isMarketOpen();
    let priceData = null;
    let dataSource = 'previous day';

    // Try to get real-time snapshot first (works during market hours)
    if (marketOpen) {
      try {
        const snapshotResponse = await axios.get(
          'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers',
          {
            params: {
              apiKey: apiKey,
              tickers: 'SPX'
            },
            timeout: 5000
          }
        );

        if (snapshotResponse.data?.tickers?.length > 0) {
          const ticker = snapshotResponse.data.tickers[0];
          const day = ticker.day || {};
          const prevDay = ticker.prevDay || {};
          const lastQuote = ticker.lastQuote || {};
          const lastTrade = ticker.lastTrade || {};

          priceData = {
            price: lastTrade.p || day.c || prevDay.c,
            bid: lastQuote.P || null,
            ask: lastQuote.p || null,
            change: day.c && prevDay.c ? day.c - prevDay.c : 0,
            percentChange: day.c && prevDay.c ? ((day.c - prevDay.c) / prevDay.c) * 100 : 0,
            volume: day.v || 0,
            previousClose: prevDay.c,
            high: day.h || prevDay.h,
            low: day.l || prevDay.l,
            open: day.o || prevDay.o,
            vwap: day.vw || null,
            transactions: day.n || 0,
            source: 'polygon.io',
            marketStatus: 'open',
            isRealTime: true
          };
          dataSource = 'real-time snapshot';
        }
      } catch (snapshotError) {
        console.log('Snapshot API failed, falling back to aggregates:', snapshotError.message);
      }
    }

    // Fallback to previous day aggregates if snapshot fails or market closed
    if (!priceData) {
      const response = await axios.get(
        'https://api.polygon.io/v2/aggs/ticker/I:SPX/prev',
        {
          params: {
            apiKey: apiKey,
            adjusted: true
          },
          timeout: 10000
        }
      );

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error('No price data returned from Polygon.io. Please verify your API key has access to indices data.');
      }

      const result = response.data.results[0];
      
      // Calculate change using previous close
      const price = result.c; // Close price
      const previousClose = result.o; // Open price as previous close approximation
      const change = price - previousClose;
      const percentChange = previousClose !== 0 ? (change / previousClose) * 100 : 0;

      priceData = {
        price: price,
        bid: null,
        ask: null,
        change: change,
        percentChange: percentChange,
        volume: result.v,
        previousClose: previousClose,
        high: result.h,
        low: result.l,
        open: result.o,
        vwap: result.vw,
        transactions: result.n,
        source: 'polygon.io',
        marketStatus: marketOpen ? 'open' : 'closed',
        isRealTime: false
      };
    }

    console.log(`SPX price fetched from ${dataSource}, market ${marketOpen ? 'open' : 'closed'}`);
    return priceData;

  } catch (error) {
    console.error('Polygon.io fetch error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Invalid Polygon.io API key. Please check your POLYGON_API_KEY in the .env file.');
      }
      
      if (error.response.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded. Please wait a moment and try again.');
      }
    }
    throw error;
  }
}

/**
 * Clear cache (for manual refresh)
 */
export function clearPriceCache() {
  priceCache = null;
  lastFetchTime = 0;
  return { success: true };
}
