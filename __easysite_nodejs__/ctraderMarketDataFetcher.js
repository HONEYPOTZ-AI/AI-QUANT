
/**
 * cTrader Market Data Fetcher
 * Fetches real-time and historical market data for CFD instruments
 * 
 * Actions:
 * - getSymbols: Get available trading symbols
 * - getQuote: Get real-time quote for a symbol
 * - getQuotes: Get real-time quotes for multiple symbols
 * - getCandles: Get historical candlestick data
 * - getTrends: Get market trends and analysis
 * - getSymbolInfo: Get detailed symbol information
 */

async function ctraderMarketDataFetcher(action, params = {}) {
  const API_BASE_URL = 'https://api.ctrader.com';
  const API_VERSION = 'v3';
  const TABLE_ID = 51256; // ctrader_api_settings

  // Helper to get access token
  async function getAccessToken(userId) {
    const { data, error } = await easysite.run({
      path: '__easysite_nodejs__/ctraderAuthHandler.js',
      param: ['getStoredToken', { userId }]
    });
    
    if (error) throw new Error(`Failed to get access token: ${error}`);
    return data.accessToken;
  }

  // Helper to get account ID
  async function getAccountId(userId) {
    const { data, error } = await easysite.table.page(TABLE_ID, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });
    
    if (error) throw new Error(`Failed to fetch account ID: ${error}`);
    const accountId = data?.List?.[0]?.account_id;
    if (!accountId) throw new Error('No account ID configured. Please connect your account first.');
    return accountId;
  }

  // Helper to make authenticated API request
  async function makeApiRequest(userId, endpoint, method = 'GET', body = null, queryParams = {}) {
    const accessToken = await getAccessToken(userId);
// Build query string
    let url = `${API_BASE_URL}/${API_VERSION}${endpoint}`;
    const queryString = Object.keys(queryParams)
      .filter(key => queryParams[key] !== undefined && queryParams[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join('&');
    
    if (queryString) {
      url += `?${queryString}`;
    }

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = body;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;
      throw new Error(`API request failed (${statusCode}): ${errorMsg}`);
    }
  }

  switch (action) {
    case 'getSymbols': {
      // Get available trading symbols
      const { userId, accountId } = params;
      if (!userId) throw new Error('userId is required');
      
      const accId = accountId || await getAccountId(userId);
      const symbols = await makeApiRequest(userId, `/accounts/${accId}/symbols`);
      
      return {
        symbols: symbols || [],
        count: symbols?.length || 0,
        timestamp: new Date().toISOString()
      };
    }

    case 'getQuote': {
      // Get real-time quote for a single symbol
      const { userId, symbol, accountId } = params;
      if (!userId || !symbol) throw new Error('userId and symbol are required');
      
      const accId = accountId || await getAccountId(userId);
      const quote = await makeApiRequest(userId, `/accounts/${accId}/symbols/${symbol}/quote`);
      
      return {
        symbol,
        bid: quote?.bid,
        ask: quote?.ask,
        spread: quote?.ask && quote?.bid ? quote.ask - quote.bid : 0,
        timestamp: quote?.timestamp || new Date().toISOString(),
        data: quote
      };
    }

    case 'getQuotes': {
      // Get real-time quotes for multiple symbols
      const { userId, symbols, accountId } = params;
      if (!userId || !symbols || !Array.isArray(symbols)) {
        throw new Error('userId and symbols array are required');
      }
      
      const accId = accountId || await getAccountId(userId);
      const quotes = [];
      
      // Fetch quotes for each symbol
      for (const symbol of symbols) {
        try {
          const quote = await makeApiRequest(userId, `/accounts/${accId}/symbols/${symbol}/quote`);
          quotes.push({
            symbol,
            bid: quote?.bid,
            ask: quote?.ask,
            spread: quote?.ask && quote?.bid ? quote.ask - quote.bid : 0,
            timestamp: quote?.timestamp || new Date().toISOString(),
            success: true
          });
        } catch (error) {
          quotes.push({
            symbol,
            error: error.message,
            success: false
          });
        }
      }
      
      return {
        quotes,
        count: quotes.length,
        timestamp: new Date().toISOString()
      };
    }

    case 'getCandles': {
      // Get historical candlestick data
      const { userId, symbol, timeframe = 'H1', count = 100, accountId, from, to } = params;
      if (!userId || !symbol) throw new Error('userId and symbol are required');
      
      const accId = accountId || await getAccountId(userId);
      
      const queryParams = {
        timeframe,
        count
      };
      
      if (from) queryParams.from = from;
      if (to) queryParams.to = to;
      
      const candles = await makeApiRequest(
        userId,
        `/accounts/${accId}/symbols/${symbol}/candles`,
        'GET',
        null,
        queryParams
      );
      
      return {
        symbol,
        timeframe,
        candles: candles || [],
        count: candles?.length || 0,
        timestamp: new Date().toISOString()
      };
    }

    case 'getTrends': {
      // Get market trends (analyze recent candles)
      const { userId, symbol, timeframe = 'H1', accountId } = params;
      if (!userId || !symbol) throw new Error('userId and symbol are required');
      
      const accId = accountId || await getAccountId(userId);
      
      // Fetch recent candles for trend analysis
      const candles = await makeApiRequest(
        userId,
        `/accounts/${accId}/symbols/${symbol}/candles`,
        'GET',
        null,
        { timeframe, count: 50 }
      );
      
      if (!candles || candles.length < 2) {
        throw new Error('Insufficient data for trend analysis');
      }

      // Simple trend analysis
      const recent = candles.slice(-10);
      let upCount = 0;
      let downCount = 0;
      
      for (let i = 1; i < recent.length; i++) {
        if (recent[i].close > recent[i - 1].close) upCount++;
        else if (recent[i].close < recent[i - 1].close) downCount++;
      }
      
      const trend = upCount > downCount ? 'bullish' : downCount > upCount ? 'bearish' : 'neutral';
      const strength = Math.abs(upCount - downCount) / (recent.length - 1);
      
      return {
        symbol,
        trend,
        strength: Math.round(strength * 100),
        upCount,
        downCount,
        candleCount: candles.length,
        latestPrice: recent[recent.length - 1].close,
        timestamp: new Date().toISOString()
      };
    }

    case 'getSymbolInfo': {
      // Get detailed symbol information
      const { userId, symbol, accountId } = params;
      if (!userId || !symbol) throw new Error('userId and symbol are required');
      
      const accId = accountId || await getAccountId(userId);
      const symbolInfo = await makeApiRequest(userId, `/accounts/${accId}/symbols/${symbol}`);
      
      return {
        symbol,
        info: symbolInfo,
        timestamp: new Date().toISOString()
      };
    }

    case 'searchSymbols': {
      // Search for symbols by name or pattern
      const { userId, query, accountId } = params;
      if (!userId || !query) throw new Error('userId and query are required');
      
      const accId = accountId || await getAccountId(userId);
      const allSymbols = await makeApiRequest(userId, `/accounts/${accId}/symbols`);
      
      const searchQuery = query.toLowerCase();
      const filtered = allSymbols.filter(symbol => 
        symbol.name?.toLowerCase().includes(searchQuery) ||
        symbol.description?.toLowerCase().includes(searchQuery)
      );
      
      return {
        query,
        symbols: filtered,
        count: filtered.length,
        timestamp: new Date().toISOString()
      };
    }

    case 'getMarketDepth': {
      // Get market depth (order book) for a symbol
      const { userId, symbol, accountId } = params;
      if (!userId || !symbol) throw new Error('userId and symbol are required');
      
      const accId = accountId || await getAccountId(userId);
      
      try {
        const depth = await makeApiRequest(userId, `/accounts/${accId}/symbols/${symbol}/depth`);
        
        return {
          symbol,
          bids: depth?.bids || [],
          asks: depth?.asks || [],
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        // Market depth might not be available for all symbols
        throw new Error(`Market depth not available for ${symbol}: ${error.message}`);
      }
    }

    default:
      throw new Error(`Unknown action: ${action}. Available actions: getSymbols, getQuote, getQuotes, getCandles, getTrends, getSymbolInfo, searchSymbols, getMarketDepth`);
  }
}

module.exports = ctraderMarketDataFetcher;
