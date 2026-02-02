import axios from 'npm:axios';

/**
 * Python FastAPI Service Bridge
 * Handles communication between Deno backend and Python FastAPI service
 */

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8000;
const REQUEST_TIMEOUT = 30000;

/**
 * Get service URL from settings
 */
function getServiceUrl() {
  // In production, retrieve from database or environment variables
  const host = Deno.env.get('PYTHON_SERVICE_HOST') || DEFAULT_HOST;
  const port = Deno.env.get('PYTHON_SERVICE_PORT') || DEFAULT_PORT;
  return `http://${host}:${port}`;
}

/**
 * Test connection to Python service
 */
export async function testPythonServiceConnection(host = DEFAULT_HOST, port = DEFAULT_PORT) {
  const serviceUrl = `http://${host}:${port}`;
  
  try {
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: 5000
    });

    if (response.status === 200) {
      // Fetch service info
      const infoResponse = await axios.get(`${serviceUrl}/`, {
        timeout: 5000
      });

      return {
        status: 'connected',
        host,
        port,
        serviceUrl,
        serviceInfo: infoResponse.data,
        connectedAt: new Date().toISOString()
      };
    }

    throw new Error('Service not responding');
  } catch (error) {
    throw new Error(`Failed to connect to Python service: ${error.message}`);
  }
}

/**
 * Fetch market data from Python service
 */
export async function fetchPythonMarketData(symbols) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/market-data`,
      { symbols },
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Market data request failed');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch market data: ${error.message}`);
  }
}

/**
 * Analyze iron condor strategy using Python service
 */
export async function analyzePythonIronCondor(strategyConfig) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/iron-condor/analyze`,
      strategyConfig,
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Iron condor analysis failed');
    }

    return response.data.analysis;
  } catch (error) {
    console.error('Python iron condor analysis error:', error);
    throw new Error(`Failed to analyze iron condor: ${error.message}`);
  }
}

/**
 * Calculate iron condor Greeks using Python service
 */
export async function calculatePythonIronCondorGreeks(greeksRequest) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/iron-condor/greeks`,
      greeksRequest,
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Greeks calculation failed');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to calculate Greeks: ${error.message}`);
  }
}

/**
 * Optimize iron condor strikes using Python service
 */
export async function optimizePythonIronCondor(optimizationRequest) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/iron-condor/optimize`,
      optimizationRequest,
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Optimization failed');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to optimize iron condor: ${error.message}`);
  }
}

/**
 * Monitor iron condor position using Python service
 */
export async function monitorPythonPosition(monitorRequest) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/iron-condor/monitor`,
      monitorRequest,
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Position monitoring failed');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to monitor position: ${error.message}`);
  }
}

/**
 * Fetch positions from Python service
 */
export async function fetchPythonPositions(accountId = null) {
  const serviceUrl = getServiceUrl();
  
  try {
    const params = accountId ? { account_id: accountId } : {};
    const response = await axios.get(`${serviceUrl}/positions`, {
      params,
      timeout: REQUEST_TIMEOUT
    });

    if (!response.data?.success) {
      throw new Error('Failed to fetch positions');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch positions: ${error.message}`);
  }
}

/**
 * Fetch equity data from Python service
 */
export async function fetchPythonEquity(accountId = null) {
  const serviceUrl = getServiceUrl();
  
  try {
    const params = accountId ? { account_id: accountId } : {};
    const response = await axios.get(`${serviceUrl}/equity`, {
      params,
      timeout: REQUEST_TIMEOUT
    });

    if (!response.data?.success) {
      throw new Error('Failed to fetch equity');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch equity: ${error.message}`);
  }
}

/**
 * Batch update positions using Python service
 */
export async function batchUpdatePythonPositions(positions, marketData) {
  const serviceUrl = getServiceUrl();
  
  try {
    const response = await axios.post(
      `${serviceUrl}/iron-condor/batch-update`,
      { positions, market_data: marketData },
      { timeout: REQUEST_TIMEOUT }
    );

    if (!response.data?.success) {
      throw new Error('Batch update failed');
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to batch update: ${error.message}`);
  }
}
