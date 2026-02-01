/**
 * SPX Options Chain Fetcher
 * Fetches real-time SPX options chain data
 */

import _dayjs from 'npm:dayjs@1.11.13';

const CACHE_DURATION = 10000; // Cache for 10 seconds (options data changes less frequently)
let optionsCache = null;
let lastFetchTime = 0;

/**
 * Fetch SPX options chain
 * @param {number} userId - User ID
 * @param {Object} params - Filter parameters
 * @returns {Object} Options chain data
 */
export async function fetchSPXOptionsChain(userId, params = {}) {
  try {
    const now = Date.now();
    const cacheKey = JSON.stringify(params);
    
    // Return cached data if still valid and params match
    if (optionsCache && 
        optionsCache.cacheKey === cacheKey && 
        (now - lastFetchTime) < CACHE_DURATION) {
      return optionsCache.data;
    }

    // Try ThinkorSwim first
    let optionsData = await fetchOptionsFromThinkorSwim(userId, params);
    
    // Fallback to FastAPI
    if (!optionsData) {
      optionsData = await fetchOptionsFromFastAPI(userId, params);
    }

    if (!optionsData) {
      throw new Error('Unable to fetch options chain from any data source');
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
 * Fetch options from ThinkorSwim
 */
async function fetchOptionsFromThinkorSwim(userId, params) {
  try {
    const { data: settings } = await easysite.table.page(58031, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (!settings?.List?.[0]?.is_connected || !settings.List[0].access_token) {
      return null;
    }

    const config = settings.List[0];
    const axios = (await import('npm:axios@1.7.9')).default;

    // Determine date range
    const fromDate = params.fromDate || _dayjs().format('YYYY-MM-DD');
    const toDate = params.toDate || _dayjs().add(60, 'days').format('YYYY-MM-DD');

    // Fetch options chain
    const response = await axios.get(
      'https://api.tdameritrade.com/v1/marketdata/chains',
      {
        params: {
          symbol: 'SPX',
          contractType: params.contractType || 'ALL',
          strikeCount: params.strikeCount || 20,
          includeQuotes: 'TRUE',
          strategy: 'SINGLE',
          range: params.range || 'ALL',
          fromDate,
          toDate
        },
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        },
        timeout: 10000
      }
    );

    const chain = response.data;
    
    // Process and format options data
    const options = [];
    
    // Process calls
    if (chain.callExpDateMap) {
      for (const [expDate, strikes] of Object.entries(chain.callExpDateMap)) {
        for (const [strike, contracts] of Object.entries(strikes)) {
          contracts.forEach(contract => {
            options.push(formatThinkorSwimOption(contract, 'CALL', expDate));
          });
        }
      }
    }
    
    // Process puts
    if (chain.putExpDateMap) {
      for (const [expDate, strikes] of Object.entries(chain.putExpDateMap)) {
        for (const [strike, contracts] of Object.entries(strikes)) {
          contracts.forEach(contract => {
            options.push(formatThinkorSwimOption(contract, 'PUT', expDate));
          });
        }
      }
    }

    return {
      symbol: 'SPX',
      underlyingPrice: chain.underlyingPrice,
      options,
      source: 'thinkorswim'
    };
  } catch (error) {
    console.error('ThinkorSwim options fetch error:', error.message);
    return null;
  }
}

/**
 * Format ThinkorSwim option contract
 */
function formatThinkorSwimOption(contract, type, expDate) {
  return {
    symbol: contract.symbol,
    description: contract.description,
    type,
    strike: contract.strikePrice,
    expiration: expDate.split(':')[0],
    daysToExpiration: contract.daysToExpiration,
    bid: contract.bid,
    ask: contract.ask,
    last: contract.last,
    mark: contract.mark,
    bidSize: contract.bidSize,
    askSize: contract.askSize,
    volume: contract.totalVolume,
    openInterest: contract.openInterest,
    impliedVolatility: contract.volatility,
    delta: contract.delta,
    gamma: contract.gamma,
    theta: contract.theta,
    vega: contract.vega,
    rho: contract.rho,
    inTheMoney: contract.inTheMoney,
    intrinsicValue: contract.intrinsicValue,
    extrinsicValue: contract.extrinsicValue,
    theoreticalValue: contract.theoreticalOptionValue
  };
}

/**
 * Fetch options from FastAPI
 */
async function fetchOptionsFromFastAPI(userId, params) {
  try {
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

    const axios = (await import('npm:axios@1.7.9')).default;
    const response = await axios.get(
      `${baseUrl}/options/chain/SPX`,
      {
        params: {
          contractType: params.contractType,
          strikeCount: params.strikeCount || 20,
          daysToExpiration: params.daysToExpiration
        },
        timeout: 10000
      }
    );

    return {
      symbol: 'SPX',
      underlyingPrice: response.data.underlying_price,
      options: response.data.options || [],
      source: 'fastapi'
    };
  } catch (error) {
    console.error('FastAPI options fetch error:', error.message);
    return null;
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
