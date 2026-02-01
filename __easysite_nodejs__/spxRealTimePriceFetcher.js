/**
 * Real-time SPX Price Fetcher
 * Fetches live SPX index price from Polygon.io API
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
      return priceCache;
    }

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

    return priceCache;
  } catch (error) {
    console.error('Error fetching real-time SPX price:', error);
    throw new Error(`Failed to fetch SPX price: ${error.message}`);
  }
}

/**
 * Fetch SPX price from Polygon.io
 */
async function fetchFromPolygon() {
  try {
    const apiKey = Deno.env.get('POLYGON_API_KEY');
    
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not found in environment variables');
    }

    const axios = (await import('npm:axios@1.7.9')).default;
    
    // Get previous day's close data for SPX (I:SPX is the index ticker on Polygon)
    // Using /v2/aggs/ticker endpoint for aggregated data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    const response = await axios.get(
      `https://api.polygon.io/v2/aggs/ticker/I:SPX/prev`,
      {
        params: {
          apiKey: apiKey,
          adjusted: true
        },
        timeout: 10000
      }
    );

    if (!response.data || !response.data.results || response.data.results.length === 0) {
      throw new Error('No price data returned from Polygon.io');
    }

    const result = response.data.results[0];
    
    // Calculate change and percent change
    const price = result.c; // Close price
    const previousClose = result.o; // Open price as previous close approximation
    const change = price - previousClose;
    const percentChange = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      price: price,
      bid: null, // Polygon.io doesn't provide bid/ask for indices in this endpoint
      ask: null,
      change: change,
      percentChange: percentChange,
      volume: result.v,
      previousClose: previousClose,
      high: result.h,
      low: result.l,
      open: result.o,
      vwap: result.vw, // Volume weighted average price
      transactions: result.n, // Number of transactions
      source: 'polygon.io'
    };
  } catch (error) {
    console.error('Polygon.io fetch error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
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
