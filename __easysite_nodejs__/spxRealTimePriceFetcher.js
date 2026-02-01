/**
 * Real-time SPX Price Fetcher
 * Fetches live SPX index price from configured data source
 */

const CACHE_DURATION = 5000; // Cache for 5 seconds
let priceCache = null;
let lastFetchTime = 0;

/**
 * Fetch real-time SPX price
 * @param {number} userId - User ID for API configuration
 * @returns {Object} SPX price data with timestamp
 */
export async function fetchRealTimeSPXPrice(userId) {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (priceCache && (now - lastFetchTime) < CACHE_DURATION) {
      return priceCache;
    }

    // Try to fetch from ThinkorSwim first
    let priceData = await fetchFromThinkorSwim(userId);
    
    // Fallback to FastAPI if ThinkorSwim fails
    if (!priceData) {
      priceData = await fetchFromFastAPI(userId);
    }

    if (!priceData) {
      throw new Error('Unable to fetch SPX price from any data source');
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
 * Fetch SPX price from ThinkorSwim
 */
async function fetchFromThinkorSwim(userId) {
  try {
    // Get ThinkorSwim settings
    const { data: settings } = await easysite.table.page(58031, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (!settings?.List?.[0]) {
      return null;
    }

    const config = settings.List[0];
    if (!config.is_connected || !config.access_token) {
      return null;
    }

    // Fetch SPX quote from ThinkorSwim API
    const axios = (await import('npm:axios@1.7.9')).default;
    const response = await axios.get(
      `https://api.tdameritrade.com/v1/marketdata/$SPX.X/quotes`,
      {
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        },
        timeout: 5000
      }
    );

    const quote = response.data['$SPX.X'];
    if (!quote) {
      return null;
    }

    return {
      price: quote.lastPrice || quote.mark,
      bid: quote.bidPrice,
      ask: quote.askPrice,
      change: quote.netChange,
      percentChange: quote.netPercentChangeInDouble,
      volume: quote.totalVolume,
      previousClose: quote.closePrice,
      high: quote.highPrice,
      low: quote.lowPrice,
      open: quote.openPrice,
      source: 'thinkorswim'
    };
  } catch (error) {
    console.error('ThinkorSwim fetch error:', error.message);
    return null;
  }
}

/**
 * Fetch SPX price from FastAPI
 */
async function fetchFromFastAPI(userId) {
  try {
    // Get FastAPI settings
    const { data: settings } = await easysite.table.page(58031, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (!settings?.List?.[0]) {
      return null;
    }

    const config = settings.List[0];
    const baseUrl = config.api_base_url || process.env.FASTAPI_BASE_URL;
    
    if (!baseUrl) {
      return null;
    }

    // Fetch SPX quote from FastAPI
    const axios = (await import('npm:axios@1.7.9')).default;
    const response = await axios.get(
      `${baseUrl}/market-data/quote/SPX`,
      {
        timeout: 5000
      }
    );

    const quote = response.data;
    return {
      price: quote.last_price || quote.price,
      bid: quote.bid,
      ask: quote.ask,
      change: quote.change,
      percentChange: quote.percent_change,
      volume: quote.volume,
      previousClose: quote.previous_close,
      high: quote.high,
      low: quote.low,
      open: quote.open,
      source: 'fastapi'
    };
  } catch (error) {
    console.error('FastAPI fetch error:', error.message);
    return null;
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
