/**
 * Fetches real-time SPX and VIX market data
 * Uses Alpha Vantage API (free tier) as primary source
 * Falls back to ThinkorSwim or FastAPI if configured
 */

// Free API key for Alpha Vantage (demo key - replace with your own for production)
const ALPHA_VANTAGE_KEY = 'demo';

async function fetchFromAlphaVantage(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      return null;
    }
    
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const percentChange = parseFloat(quote['10. change percent'].replace('%', ''));
    const previousClose = parseFloat(quote['08. previous close']);
    
    return {
      price,
      change,
      percentChange,
      previousClose
    };
  } catch (error) {
    console.error(`Alpha Vantage fetch error for ${symbol}:`, error);
    return null;
  }
}

async function fetchFromYahooFinance(symbol) {
  try {
    // Yahoo Finance API endpoint (unofficial but free)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    
    if (!result) {
      return null;
    }
    
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - previousClose;
    const percentChange = (change / previousClose) * 100;
    
    return {
      price,
      change,
      percentChange,
      previousClose
    };
  } catch (error) {
    console.error(`Yahoo Finance fetch error for ${symbol}:`, error);
    return null;
  }
}

async function fetchSPXVIXData(userId) {
  try {
    const results = {
      spx: null,
      vix: null,
      source: null,
      timestamp: new Date().toISOString()
    };

    // Try Yahoo Finance first (free and reliable for SPX and VIX)
    try {
      const spxData = await fetchFromYahooFinance('^GSPC'); // S&P 500 symbol
      const vixData = await fetchFromYahooFinance('^VIX');  // VIX symbol
      
      if (spxData) {
        results.spx = spxData;
      }
      
      if (vixData) {
        results.vix = vixData;
      }
      
      if (spxData || vixData) {
        results.source = 'Yahoo Finance';
        return results;
      }
    } catch (yahooError) {
      console.error('Yahoo Finance fetch failed, trying alternatives:', yahooError);
    }

    // Try ThinkorSwim if configured
    const { data: tosSettings } = await easysite.table.page(58031, {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "user_id", op: "Equal", value: userId },
        { name: "is_active", op: "Equal", value: true }
      ]
    });

    if (tosSettings?.List?.[0]) {
      try {
        const tosConfig = tosSettings.List[0];
        const apiKey = tosConfig.api_key;
        const baseUrl = 'https://api.schwabapi.com/marketdata/v1';

        // Fetch SPX quote
        const spxResponse = await fetch(`${baseUrl}/quotes?symbols=$SPX.X`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });

        // Fetch VIX quote
        const vixResponse = await fetch(`${baseUrl}/quotes?symbols=$VIX.X`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        });

        if (spxResponse.ok && vixResponse.ok) {
          const spxData = await spxResponse.json();
          const vixData = await vixResponse.json();

          const spxQuote = spxData['$SPX.X']?.quote;
          const vixQuote = vixData['$VIX.X']?.quote;

          if (spxQuote) {
            results.spx = {
              price: spxQuote.lastPrice || spxQuote.mark,
              change: spxQuote.netChange || 0,
              percentChange: spxQuote.netPercentChange || 0,
              previousClose: spxQuote.closePrice
            };
          }

          if (vixQuote) {
            results.vix = {
              price: vixQuote.lastPrice || vixQuote.mark,
              change: vixQuote.netChange || 0,
              percentChange: vixQuote.netPercentChange || 0,
              previousClose: vixQuote.closePrice
            };
          }

          results.source = 'ThinkorSwim';
          return results;
        }
      } catch (tosError) {
        console.error('ThinkorSwim fetch error:', tosError);
      }
    }

    // Try FastAPI as final fallback
    const { data: fastapiSettings } = await easysite.table.page(56078, {
      PageNo: 1,
      PageSize: 1,
      Filters: [
        { name: "user_id", op: "Equal", value: userId },
        { name: "is_active", op: "Equal", value: true }
      ]
    });

    if (fastapiSettings?.List?.[0]) {
      try {
        const fastapiConfig = fastapiSettings.List[0];
        const baseUrl = fastapiConfig.base_url;

        // Fetch SPX data
        const spxResponse = await fetch(`${baseUrl}/market-data/quote?symbol=SPX`, {
          headers: { 'Content-Type': 'application/json' }
        });

        // Fetch VIX data
        const vixResponse = await fetch(`${baseUrl}/market-data/quote?symbol=VIX`, {
          headers: { 'Content-Type': 'application/json' }
        });

        if (spxResponse.ok && vixResponse.ok) {
          const spxData = await spxResponse.json();
          const vixData = await vixResponse.json();

          if (spxData) {
            results.spx = {
              price: spxData.lastPrice || spxData.price,
              change: spxData.change || 0,
              percentChange: spxData.percentChange || 0,
              previousClose: spxData.previousClose
            };
          }

          if (vixData) {
            results.vix = {
              price: vixData.lastPrice || vixData.price,
              change: vixData.change || 0,
              percentChange: vixData.percentChange || 0,
              previousClose: vixData.previousClose
            };
          }

          results.source = 'FastAPI';
          return results;
        }
      } catch (fastapiError) {
        console.error('FastAPI fetch error:', fastapiError);
      }
    }

    // If all sources failed
    if (!results.spx && !results.vix) {
      throw new Error('Unable to fetch market data. All data sources unavailable. Please try again later or configure a custom data source.');
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to fetch SPX/VIX data: ${error.message}`);
  }
}

export { fetchSPXVIXData };
