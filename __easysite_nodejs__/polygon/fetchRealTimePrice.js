import axios from "npm:axios";

/**
 * Fetch real-time price for a specific ticker
 * @param {string} ticker - Stock ticker symbol (e.g., 'AAPL', 'SPY', 'SPX')
 * @returns {Object} Real-time price data
 */
export async function fetchRealTimePrice(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('Ticker symbol is required and must be a string');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    // Use snapshot endpoint for real-time data
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    const response = await axios.get(url, {
      params: {
        apiKey: apiKey
      },
      timeout: 10000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    if (!response.data.ticker) {
      throw new Error(`No price data found for ticker: ${ticker}`);
    }

    const tickerData = response.data.ticker;

    return {
      ticker: tickerData.ticker,
      day: tickerData.day,
      lastTrade: tickerData.lastTrade,
      lastQuote: tickerData.lastQuote,
      min: tickerData.min,
      prevDay: tickerData.prevDay,
      todaysChange: tickerData.todaysChange,
      todaysChangePerc: tickerData.todaysChangePerc,
      updated: tickerData.updated
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Invalid Polygon API key');
      } else if (status === 403) {
        throw new Error('Polygon API access forbidden - check subscription tier');
      } else if (status === 404) {
        throw new Error(`Ticker not found: ${ticker}`);
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
 * Fetch last trade for a ticker
 * @param {string} ticker - Stock ticker symbol
 * @returns {Object} Last trade data
 */
export async function fetchLastTrade(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('Ticker symbol is required and must be a string');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const url = `https://api.polygon.io/v2/last/trade/${ticker}`;
    const response = await axios.get(url, {
      params: {
        apiKey: apiKey
      },
      timeout: 10000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    if (!response.data.results) {
      throw new Error(`No trade data found for ticker: ${ticker}`);
    }

    return {
      ticker: ticker,
      price: response.data.results.p,
      size: response.data.results.s,
      exchange: response.data.results.x,
      timestamp: response.data.results.t,
      conditions: response.data.results.c,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 404) throw new Error(`Ticker not found: ${ticker}`);
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch last trade: ${error.message}`);
  }
}

/**
 * Fetch last quote for a ticker
 * @param {string} ticker - Stock ticker symbol
 * @returns {Object} Last quote data with bid/ask
 */
export async function fetchLastQuote(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    throw new Error('Ticker symbol is required and must be a string');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const url = `https://api.polygon.io/v2/last/nbbo/${ticker}`;
    const response = await axios.get(url, {
      params: {
        apiKey: apiKey
      },
      timeout: 10000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    if (!response.data.results) {
      throw new Error(`No quote data found for ticker: ${ticker}`);
    }

    return {
      ticker: ticker,
      bidPrice: response.data.results.P,
      bidSize: response.data.results.S,
      askPrice: response.data.results.p,
      askSize: response.data.results.s,
      timestamp: response.data.results.t,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 404) throw new Error(`Ticker not found: ${ticker}`);
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch last quote: ${error.message}`);
  }
}

/**
 * Fetch multiple tickers' real-time prices in batch
 * @param {Array<string>} tickers - Array of ticker symbols
 * @returns {Object} Price data for all tickers
 */
export async function fetchBatchPrices(tickers) {
  if (!Array.isArray(tickers) || tickers.length === 0) {
    throw new Error('Tickers must be a non-empty array');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    // Fetch prices for each ticker
    const promises = tickers.map(ticker => fetchRealTimePrice(ticker));
    const results = await Promise.allSettled(promises);

    const priceData = {};
    const errors = [];

    results.forEach((result, index) => {
      const ticker = tickers[index];
      if (result.status === 'fulfilled') {
        priceData[ticker] = result.value;
      } else {
        errors.push({
          ticker: ticker,
          error: result.reason.message
        });
      }
    });

    return {
      prices: priceData,
      errors: errors,
      successCount: Object.keys(priceData).length,
      errorCount: errors.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch batch prices: ${error.message}`);
  }
}
