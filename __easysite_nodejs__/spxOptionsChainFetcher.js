/**
 * SPX Options Chain Fetcher
 * Fetches real-time SPX options chain data from Polygon.io
 */

import _dayjs from 'npm:dayjs@1.11.13';

const CACHE_DURATION = 10000; // Cache for 10 seconds (options data changes less frequently)
let optionsCache = null;
let lastFetchTime = 0;

/**
 * Fetch SPX options chain
 * @param {Object} params - Filter parameters
 * @returns {Object} Options chain data
 */
export async function fetchSPXOptionsChain(params = {}) {
  try {
    const now = Date.now();
    const cacheKey = JSON.stringify(params);
    
    // Return cached data if still valid and params match
    if (optionsCache && 
        optionsCache.cacheKey === cacheKey && 
        (now - lastFetchTime) < CACHE_DURATION) {
      return optionsCache.data;
    }

    // Fetch from Polygon.io
    const optionsData = await fetchOptionsFromPolygon(params);

    if (!optionsData) {
      throw new Error('Unable to fetch options chain from Polygon.io');
    }

    // Cache the result
    optionsCache = {
      data: {
        ...optionsData,
        timestamp: new Date().toISOString()
      },
      cacheKey
    };
    lastFetchTime = now;

    return optionsCache.data;
  } catch (error) {
    console.error('Error fetching SPX options chain:', error);
    throw new Error(`Failed to fetch options chain: ${error.message}`);
  }
}

/**
 * Fetch options from Polygon.io
 */
async function fetchOptionsFromPolygon(params) {
  try {
    const apiKey = Deno.env.get('POLYGON_API_KEY');
    
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not found in environment variables');
    }

    const axios = (await import('npm:axios@1.7.9')).default;

    // Build query parameters
    const queryParams = {
      apiKey: apiKey,
      underlying_ticker: 'SPX',
      limit: params.limit || 1000,
      order: 'asc',
      sort: 'expiration_date'
    };

    // Add contract type filter if specified
    if (params.contractType) {
      queryParams.contract_type = params.contractType.toLowerCase();
    }

    // Add expiration date filter if specified
    if (params.expirationDate) {
      queryParams.expiration_date = params.expirationDate;
    } else if (params.expirationDateGte) {
      queryParams['expiration_date.gte'] = params.expirationDateGte;
    } else {
      // Default to contracts expiring from today
      queryParams['expiration_date.gte'] = _dayjs().format('YYYY-MM-DD');
    }

    if (params.expirationDateLte) {
      queryParams['expiration_date.lte'] = params.expirationDateLte;
    } else {
      // Default to contracts expiring within 60 days
      queryParams['expiration_date.lte'] = _dayjs().add(60, 'days').format('YYYY-MM-DD');
    }

    // Add strike price filters if specified
    if (params.strikePriceGte) {
      queryParams['strike_price.gte'] = params.strikePriceGte;
    }
    if (params.strikePriceLte) {
      queryParams['strike_price.lte'] = params.strikePriceLte;
    }

    // Fetch options contracts from Polygon.io
    const response = await axios.get(
      'https://api.polygon.io/v3/reference/options/contracts',
      {
        params: queryParams,
        timeout: 15000
      }
    );

    if (!response.data || !response.data.results) {
      throw new Error('No options data returned from Polygon.io');
    }

    const contracts = response.data.results;

    // Fetch underlying price (SPX current price)
    let underlyingPrice = null;
    try {
      const priceResponse = await axios.get(
        'https://api.polygon.io/v2/aggs/ticker/I:SPX/prev',
        {
          params: { apiKey: apiKey, adjusted: true },
          timeout: 5000
        }
      );
      if (priceResponse.data?.results?.[0]) {
        underlyingPrice = priceResponse.data.results[0].c;
      }
    } catch (error) {
      console.error('Error fetching underlying price:', error.message);
    }

    // Format options data
    const options = contracts.map(contract => formatPolygonOption(contract, underlyingPrice));

    return {
      symbol: 'SPX',
      underlyingPrice: underlyingPrice,
      options: options,
      totalContracts: response.data.count || options.length,
      nextUrl: response.data.next_url || null,
      source: 'polygon.io'
    };
  } catch (error) {
    console.error('Polygon.io options fetch error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Invalid Polygon.io API key. Please check your POLYGON_API_KEY in the .env file.');
      }
      
      if (error.response.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded. Please wait a moment and try again.');
      }
    }
    throw error;
  }
}

/**
 * Format Polygon.io option contract
 */
function formatPolygonOption(contract, underlyingPrice) {
  // Calculate days to expiration
  const expirationDate = new Date(contract.expiration_date);
  const today = new Date();
  const daysToExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

  // Determine if option is in the money
  let inTheMoney = false;
  if (underlyingPrice) {
    if (contract.contract_type === 'call') {
      inTheMoney = underlyingPrice > contract.strike_price;
    } else if (contract.contract_type === 'put') {
      inTheMoney = underlyingPrice < contract.strike_price;
    }
  }

  // Calculate intrinsic value
  let intrinsicValue = 0;
  if (underlyingPrice) {
    if (contract.contract_type === 'call') {
      intrinsicValue = Math.max(0, underlyingPrice - contract.strike_price);
    } else if (contract.contract_type === 'put') {
      intrinsicValue = Math.max(0, contract.strike_price - underlyingPrice);
    }
  }

  return {
    symbol: contract.ticker,
    description: `SPX ${contract.expiration_date} ${contract.strike_price} ${contract.contract_type.toUpperCase()}`,
    type: contract.contract_type.toUpperCase(),
    strike: contract.strike_price,
    expiration: contract.expiration_date,
    daysToExpiration: daysToExpiration,
    underlyingTicker: contract.underlying_ticker,
    exerciseStyle: contract.exercise_style,
    sharesPerContract: contract.shares_per_contract,
    cfi: contract.cfi,
    primaryExchange: contract.primary_exchange,
    inTheMoney: inTheMoney,
    intrinsicValue: intrinsicValue,
    // Note: Real-time quote data (bid, ask, last, greeks) requires additional API calls
    // to /v3/snapshot/options/{underlyingAsset}/{optionContract} endpoint
    // These fields are set to null and can be populated in a separate function if needed
    bid: null,
    ask: null,
    last: null,
    mark: null,
    bidSize: null,
    askSize: null,
    volume: null,
    openInterest: null,
    impliedVolatility: null,
    delta: null,
    gamma: null,
    theta: null,
    vega: null,
    rho: null
  };
}

/**
 * Fetch detailed quote for specific option contract
 * @param {string} optionTicker - Option contract ticker (e.g., "O:SPX240119C04500000")
 * @returns {Object} Option quote with greeks
 */
export async function fetchOptionQuote(optionTicker) {
  try {
    const apiKey = Deno.env.get('POLYGON_API_KEY');
    
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not found in environment variables. Please add it to your .env file.');
    }

    const axios = (await import('npm:axios@1.7.9')).default;
    
    const response = await axios.get(
      `https://api.polygon.io/v3/snapshot/options/SPX/${optionTicker}`,
      {
        params: { apiKey: apiKey },
        timeout: 5000
      }
    );

    if (!response.data || !response.data.results) {
      throw new Error('No quote data returned from Polygon.io');
    }

    const quote = response.data.results;
    
    return {
      symbol: optionTicker,
      bid: quote.last_quote?.bid,
      ask: quote.last_quote?.ask,
      bidSize: quote.last_quote?.bid_size,
      askSize: quote.last_quote?.ask_size,
      last: quote.last_trade?.price,
      volume: quote.day?.volume,
      openInterest: quote.open_interest,
      impliedVolatility: quote.implied_volatility,
      delta: quote.greeks?.delta,
      gamma: quote.greeks?.gamma,
      theta: quote.greeks?.theta,
      vega: quote.greeks?.vega,
      source: 'polygon.io'
    };
  } catch (error) {
    console.error('Error fetching option quote:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error('Invalid Polygon.io API key. Please check your POLYGON_API_KEY in the .env file.');
      }
      
      if (error.response.status === 429) {
        throw new Error('Polygon.io API rate limit exceeded. Please wait a moment and try again.');
      }
    }
    throw error;
  }
}

/**
 * Clear options cache
 */
export function clearOptionsCache() {
  optionsCache = null;
  lastFetchTime = 0;
  return { success: true };
}
