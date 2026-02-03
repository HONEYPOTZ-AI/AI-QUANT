import axios from "npm:axios";

/**
 * Fetch SPX options chain data
 * @param {string} underlyingAsset - Underlying asset symbol (default: 'SPX')
 * @param {string} expirationDate - Expiration date in YYYY-MM-DD format (optional)
 * @param {string} contractType - Contract type: 'call' or 'put' (optional, returns both if not specified)
 * @param {number} limit - Number of results per page (default: 250, max: 1000)
 * @returns {Object} Options chain data
 */
export async function fetchOptionsChain(underlyingAsset = 'SPX', expirationDate = null, contractType = null, limit = 250) {
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  // Validate contract type if provided
  if (contractType && !['call', 'put'].includes(contractType.toLowerCase())) {
    throw new Error('contractType must be either "call" or "put"');
  }

  try {
    const params = {
      apiKey: apiKey,
      underlying_ticker: underlyingAsset,
      limit: Math.min(limit, 1000),
      sort: 'strike_price',
      order: 'asc'
    };

    // Add optional filters
    if (expirationDate) {
      params.expiration_date = expirationDate;
    }

    if (contractType) {
      params.contract_type = contractType.toLowerCase();
    }

    const url = 'https://api.polygon.io/v3/reference/options/contracts';
    const response = await axios.get(url, {
      params: params,
      timeout: 15000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    return {
      results: response.data.results || [],
      count: response.data.results?.length || 0,
      status: response.data.status,
      next_url: response.data.next_url || null
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Invalid Polygon API key');
      } else if (status === 403) {
        throw new Error('Polygon API access forbidden - options data may require higher tier subscription');
      } else if (status === 404) {
        throw new Error(`No options found for ${underlyingAsset}`);
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
 * Fetch options chain snapshot with quotes
 * @param {string} underlyingAsset - Underlying asset symbol (e.g., 'SPX', 'SPY')
 * @param {string} strikePrice - Strike price filter (optional)
 * @param {string} expirationDate - Expiration date filter (optional)
 * @returns {Object} Options snapshot with real-time quotes
 */
export async function fetchOptionsSnapshot(underlyingAsset, strikePrice = null, expirationDate = null) {
  if (!underlyingAsset) {
    throw new Error('underlyingAsset is required');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const params = {
      apiKey: apiKey
    };

    if (strikePrice) {
      params.strike_price = strikePrice;
    }

    if (expirationDate) {
      params.expiration_date = expirationDate;
    }

    const url = `https://api.polygon.io/v3/snapshot/options/${underlyingAsset}`;
    const response = await axios.get(url, {
      params: params,
      timeout: 15000
    });

    if (response.data.status === 'ERROR') {
      throw new Error(response.data.error || 'Polygon API error');
    }

    return {
      results: response.data.results || [],
      count: response.data.results?.length || 0,
      status: response.data.status
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden - options data may require higher tier');
      if (status === 404) throw new Error(`No options snapshot found for ${underlyingAsset}`);
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch options snapshot: ${error.message}`);
  }
}

/**
 * Fetch specific option contract details
 * @param {string} optionTicker - Options ticker symbol (e.g., 'O:SPX251219C05500000')
 * @returns {Object} Option contract details
 */
export async function fetchOptionContract(optionTicker) {
  if (!optionTicker) {
    throw new Error('optionTicker is required');
  }

  const apiKey = Deno.env.get('POLYGON_API_KEY');
  if (!apiKey) {
    throw new Error('POLYGON_API_KEY not configured in environment');
  }

  try {
    const url = `https://api.polygon.io/v3/reference/options/contracts/${optionTicker}`;
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
      throw new Error(`Option contract not found: ${optionTicker}`);
    }

    return response.data.results;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error('Invalid Polygon API key');
      if (status === 403) throw new Error('Polygon API access forbidden');
      if (status === 404) throw new Error(`Option contract not found: ${optionTicker}`);
      if (status === 429) throw new Error('Polygon API rate limit exceeded');
      throw new Error(`Polygon API error: ${error.response.data?.error || error.message}`);
    }
    throw new Error(`Failed to fetch option contract: ${error.message}`);
  }
}
