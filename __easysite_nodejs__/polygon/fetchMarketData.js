import axios from "npm:axios";

/**
 * Fetch real-time market data for stocks and indices
 * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'SPY', 'SPX')
 * @param {string} timespan - Timespan: minute, hour, day, week, month, quarter, year (default: 'day')
 * @param {number} limit - Number of results (default: 100)
 * @returns {Object} Market data with aggregates
 */
export async function fetchMarketData(symbol, timespan = 'day', limit = 100) {
  // Validate parameters
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Symbol is required and must be a string');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  const validTimespans = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'];
  if (!validTimespans.includes(timespan)) {
    throw new Error(`Invalid timespan. Must be one of: ${validTimespans.join(', ')}`);
  }

  try {
    // Get previous day's data
    const prevDayUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`;
    const response = await axios.get(prevDayUrl, {
      params: {
        apiKey: apiKey,
        adjusted: 'true'
      },
      timeout: 10000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    if (!response.data.results || response.data.results.length === 0) {
      throw new Error(`No market data found for symbol: ${symbol}`);
    }

    return {
      symbol: symbol,
      results: response.data.results,
      resultsCount: response.data.resultsCount,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      // API responded with error
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Invalid Polygon API key');
      } else if (status === 403) {
        throw new Error('Polygon API access forbidden - check subscription tier');
      } else if (status === 404) {
        throw new Error(`Symbol not found: ${symbol}`);
      } else if (status === 429) {
        throw new Error('Polygon API rate limit exceeded');
      } else {
        throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to reach Polygon API');
    } else {
      throw error;
    }
  }
}

/**
 * Fetch aggregates (bars) for a stock over a date range
 * @param {string} symbol - Stock symbol
 * @param {number} multiplier - Size of the timespan multiplier
 * @param {string} timespan - Size of the time window
 * @param {string} from - From date (YYYY-MM-DD)
 * @param {string} to - To date (YYYY-MM-DD)
 * @returns {Object} Aggregate data
 */
export async function fetchAggregates(symbol, multiplier, timespan, from, to) {
  if (!symbol || !multiplier || !timespan || !from || !to) {
    throw new Error('All parameters are required: symbol, multiplier, timespan, from, to');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`;
    const response = await axios.get(url, {
      params: {
        apiKey: apiKey,
        adjusted: 'true',
        sort: 'desc',
        limit: 50000
      },
      timeout: 10000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    return {
      symbol: symbol,
      results: response.data.results || [],
      resultsCount: response.data.resultsCount || 0,
      queryCount: response.data.queryCount || 0,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch aggregates: ${error.message}`);
  }
}

/**
 * Fetch market snapshot for all tickers
 * @param {string} locale - Locale (default: 'us')
 * @param {string} market - Market type (default: 'stocks')
 * @returns {Object} Market snapshot data
 */
export async function fetchMarketSnapshot(locale = 'us', market = 'stocks') {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const url = `https://api.polygon.io/v2/snapshot/locale/${locale}/markets/${market}/tickers`;
    const response = await axios.get(url, {
      params: {
        apiKey: apiKey
      },
      timeout: 15000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    return {
      tickers: response.data.tickers || [],
      count: response.data.count || 0,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch market snapshot: ${error.message}`);
  }
}
