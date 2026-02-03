import axios from "npm:axios";

/**
 * Verify Polygon API connectivity and API key validity
 * @returns {Object} Connection status and API details
 */
export async function verifyConnection() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!apiKey) {
    return {
      connected: false,
      error: 'POLYGON_API_KEY not configured in environment',
      apiKeyConfigured: false,
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Test API key with a simple request
    const testUrl = 'https://api.polygon.io/v2/aggs/ticker/AAPL/prev';
    const response = await axios.get(testUrl, {
      params: {
        apiKey: apiKey,
        adjusted: 'true'
      },
      timeout: 10000
    });

    if (response.data.status === 'OK') {
      return {
        connected: true,
        apiKeyConfigured: true,
        apiKeyValid: true,
        status: response.data.status,
        message: 'Successfully connected to Polygon API',
        timestamp: new Date().toISOString(),
        testSymbol: 'AAPL',
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } else {
      return {
        connected: false,
        apiKeyConfigured: true,
        apiKeyValid: false,
        status: response.data.status,
        error: response.data.error || 'Unknown API error',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      let errorMessage = '';
      let apiKeyValid = true;

      if (status === 401) {
        errorMessage = 'Invalid Polygon API key - Authentication failed';
        apiKeyValid = false;
      } else if (status === 403) {
        errorMessage = 'Polygon API access forbidden - Check subscription tier or permissions';
        apiKeyValid = false;
      } else if (status === 404) {
        errorMessage = 'API endpoint not found';
      } else if (status === 429) {
        errorMessage = 'Polygon API rate limit exceeded';
        apiKeyValid = true; // Key is valid but rate limited
      } else {
        errorMessage = `Polygon API error (${status}): ${error.response.data?.error || error.message}`;
      }

      return {
        connected: false,
        apiKeyConfigured: true,
        apiKeyValid: apiKeyValid,
        httpStatus: status,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    } else if (error.request) {
      return {
        connected: false,
        apiKeyConfigured: true,
        apiKeyValid: null,
        error: 'Network error: Unable to reach Polygon API. Check internet connection.',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        connected: false,
        apiKeyConfigured: true,
        apiKeyValid: null,
        error: `Connection test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Get detailed API status including rate limits and subscription info
 * @returns {Object} Detailed API status
 */
export async function getAPIStatus() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    // Make a test request to get headers with rate limit info
    const response = await axios.get('https://api.polygon.io/v2/aggs/ticker/SPY/prev', {
      params: {
        apiKey: apiKey
      },
      timeout: 10000
    });

    return {
      status: 'connected',
      apiVersion: 'v2',
      rateLimit: {
        limit: response.headers['x-ratelimit-limit'] || 'N/A',
        remaining: response.headers['x-ratelimit-remaining'] || 'N/A',
        reset: response.headers['x-ratelimit-reset'] || 'N/A'
      },
      responseTime: response.headers['x-response-time'] || 'N/A',
      serverTime: response.headers['date'] || new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to get API status: ${error.message}`);
  }
}

/**
 * Test specific API endpoints
 * @returns {Object} Test results for multiple endpoints
 */
export async function testEndpoints() {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  const endpoints = [
    {
      name: 'Market Data (Aggregates)',
      url: 'https://api.polygon.io/v2/aggs/ticker/SPY/prev',
      params: { apiKey, adjusted: 'true' }
    },
    {
      name: 'Real-Time Snapshot',
      url: 'https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/AAPL',
      params: { apiKey }
    },
    {
      name: 'Options Contracts',
      url: 'https://api.polygon.io/v3/reference/options/contracts',
      params: { apiKey, underlying_ticker: 'SPX', limit: 10 }
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await axios.get(endpoint.url, {
        params: endpoint.params,
        timeout: 10000
      });
      const endTime = Date.now();

      results.push({
        name: endpoint.name,
        success: true,
        status: response.data.status,
        responseTime: `${endTime - startTime}ms`,
        hasData: !!response.data.results || !!response.data.ticker
      });
    } catch (error) {
      results.push({
        name: endpoint.name,
        success: false,
        error: error.response?.status === 403 
          ? 'Access forbidden - May require higher tier subscription'
          : error.message
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    endpoints: results,
    successCount: results.filter(r => r.success).length,
    totalCount: results.length
  };
}
