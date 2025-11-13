/**
 * Fetches real-time SPX and VIX market data from configured sources
 * Returns current price, change, and percentage change for both indices
 */
async function fetchSPXVIXData(userId) {
  try {
    const results = {
      spx: null,
      vix: null,
      source: null,
      timestamp: new Date().toISOString()
    };

    // Try ThinkorSwim first
    const { data: tosSettings } = await easysite.table.page(58031, {
      PageNo: 1,
      PageSize: 1,
      Filters: [
      { name: "user_id", op: "Equal", value: userId },
      { name: "is_active", op: "Equal", value: true }]

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

          results.source = 'thinkorswim';
          return results;
        }
      } catch (tosError) {
        console.error('ThinkorSwim fetch error:', tosError);
      }
    }

    // Try FastAPI as fallback
    const { data: fastapiSettings } = await easysite.table.page(56078, {
      PageNo: 1,
      PageSize: 1,
      Filters: [
      { name: "user_id", op: "Equal", value: userId },
      { name: "is_active", op: "Equal", value: true }]

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

          results.source = 'fastapi';
          return results;
        }
      } catch (fastapiError) {
        console.error('FastAPI fetch error:', fastapiError);
      }
    }

    // If no data source is available or both failed, return mock data structure
    if (!results.spx && !results.vix) {
      throw new Error('No active market data source configured. Please configure ThinkorSwim or FastAPI connection.');
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to fetch SPX/VIX data: ${error.message}`);
  }
}