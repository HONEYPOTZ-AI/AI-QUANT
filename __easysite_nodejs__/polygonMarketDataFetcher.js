// Cache structure with 1-minute TTL
const cache = {
  data: null,
  timestamp: 0,
  ttl: 60000 // 1 minute in milliseconds
};

// API Configuration
const POLYGON_API_KEY = Deno.env.get('POLYGON_API_KEY');
const BASE_URL = 'https://api.polygon.io';

// Symbol mappings for Polygon API
const INDICES = {
  'SPX': 'I:SPX',   // S&P 500
  'DJI': 'I:DJI',   // Dow Jones
  'NDX': 'I:NDX',   // Nasdaq 100
  'RUT': 'I:RUT'    // Russell 2000
};

const FOREX = {
  'EUR/USD': 'C:EURUSD',
  'GBP/USD': 'C:GBPUSD',
  'USD/JPY': 'C:USDJPY'
};

const CRYPTO = {
  'BTC': 'X:BTCUSD',
  'ETH': 'X:ETHUSD'
};

/**
 * Fetch real-time snapshot for a symbol
 */
async function fetchSnapshot(ticker, type = 'stocks') {
  try {
    const axios = (await import('npm:axios@1.7.9')).default;
    
    let endpoint;
    if (type === 'stocks') {
      endpoint = `${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    } else if (type === 'forex') {
      endpoint = `${BASE_URL}/v2/snapshot/locale/global/markets/forex/tickers/${ticker}`;
    } else if (type === 'crypto') {
      endpoint = `${BASE_URL}/v2/snapshot/locale/global/markets/crypto/tickers/${ticker}`;
    }

    const response = await axios.get(endpoint, {
      params: { apiKey: POLYGON_API_KEY },
      timeout: 10000
    });

    console.log(`✅ Snapshot response for ${ticker}:`, response.status);

    if (response.data && response.data.ticker) {
      const ticker_data = response.data.ticker;
      const day = ticker_data.day || {};
      const prevDay = ticker_data.prevDay || {};
      
      const currentPrice = day.c || day.l || prevDay.c || 0;
      const previousClose = prevDay.c || 0;
      const change = currentPrice && previousClose ? currentPrice - previousClose : 0;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: ticker_data.ticker,
        price: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: day.v || 0,
        timestamp: day.t || Date.now()
      };
    }
    console.warn(`⚠️ No ticker data in response for ${ticker}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching snapshot for ${ticker}:`, error.message);
    if (error.response) {
      console.error(`API Response: ${error.response.status}`, error.response.data);
    }
    return null;
  }
}

/**
 * Fetch all market data from Polygon API
 */
async function fetchAllMarketData() {
  const results = [];

  // Fetch Indices
  for (const [displaySymbol, apiSymbol] of Object.entries(INDICES)) {
    const data = await fetchSnapshot(apiSymbol, 'stocks');
    if (data) {
      results.push({
        ...data,
        displaySymbol: displaySymbol,
        category: 'indices'
      });
    }
  }

  // Fetch Forex
  for (const [displaySymbol, apiSymbol] of Object.entries(FOREX)) {
    const data = await fetchSnapshot(apiSymbol, 'forex');
    if (data) {
      results.push({
        ...data,
        displaySymbol: displaySymbol,
        category: 'forex'
      });
    }
  }

  // Fetch Crypto
  for (const [displaySymbol, apiSymbol] of Object.entries(CRYPTO)) {
    const data = await fetchSnapshot(apiSymbol, 'crypto');
    if (data) {
      results.push({
        ...data,
        displaySymbol: displaySymbol,
        category: 'crypto'
      });
    }
  }

  return results;
}

/**
 * Main exported function to get market overview data
 * Returns cached data if available and not expired
 * 
 * @returns {Object} Market data formatted with indices, forex, crypto arrays
 */
export async function getMarketOverviewData() {
  // Check if API key is configured
  if (!POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not configured in environment variables');
  }

  // Check cache - return cached data if still valid
  const now = Date.now();
  if (cache.data && (now - cache.timestamp) < cache.ttl) {
    console.log('✅ Returning cached market overview data');
    return cache.data;
  }

  console.log('🔄 Fetching fresh market overview data from Polygon.io...');

  try {
    // Fetch fresh data from Polygon API
    const marketData = await fetchAllMarketData();

    // Format response structure
    const formattedData = {
      indices: [],
      forex: [],
      crypto: [],
      lastUpdated: now
    };

    // Categorize and format each data point
    marketData.forEach(item => {
      const formatted = {
        symbol: item.displaySymbol,
        price: item.price ? parseFloat(item.price.toFixed(2)) : 0,
        change: item.change ? parseFloat(item.change.toFixed(2)) : 0,
        changePercent: item.changePercent ? parseFloat(item.changePercent.toFixed(2)) : 0,
        volume: item.volume || 0,
        timestamp: item.timestamp
      };

      if (item.category === 'indices') {
        formattedData.indices.push(formatted);
      } else if (item.category === 'forex') {
        formattedData.forex.push(formatted);
      } else if (item.category === 'crypto') {
        formattedData.crypto.push(formatted);
      }
    });

    // Update cache with fresh data
    cache.data = formattedData;
    cache.timestamp = now;

    console.log(`✅ Market overview data cached: ${formattedData.indices.length} indices, ${formattedData.forex.length} forex, ${formattedData.crypto.length} crypto`);
    return formattedData;
  } catch (error) {
    // If we have cached data, return it even if expired (better than nothing)
    if (cache.data) {
      console.error('Error fetching market data, returning cached data:', error.message);
      return cache.data;
    }
    throw new Error(`Failed to fetch market data from Polygon.io: ${error.message}`);
  }
}

/**
 * Clear cache - utility function for manual cache invalidation
 */
export function clearCache() {
  cache.data = null;
  cache.timestamp = 0;
  return { success: true, message: 'Cache cleared' };
}
