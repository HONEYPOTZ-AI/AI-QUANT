import axios from "npm:axios@1.6.5";
import { testPythonServiceConnection } from './pythonServiceBridge.js';

/**
 * Establish connection to FastAPI Python service via HTTP
 * @param {number} userId - User ID to connect for
 * @param {Object} options - Connection options { timeout: 10000, validate: true }
 * @returns {Object} Connection result with status and details
 */
export async function fastapiConnectionManager(userId, options = {}) {
  const { timeout = 10000, validate = true } = options;

  const FASTAPI_SETTINGS_TABLE_ID = 51055;

  // Retrieve credentials (now containing Python service URL)
  const filters = userId ? [{
    name: "user_id",
    op: "Equal",
    value: userId
  }] : [];

  const { data: credData, error: credError } = await easysite.table.page({
    customTableID: FASTAPI_SETTINGS_TABLE_ID,
    pageFilter: {
      PageNo: 1,
      PageSize: 1,
      OrderByField: "id",
      IsAsc: false,
      Filters: filters
    }
  });

  if (credError) {
    throw new Error(`Failed to retrieve credentials: ${credError}`);
  }

  if (!credData?.List || credData.List.length === 0) {
    throw new Error("No FastAPI credentials found");
  }

  const credentials = credData.List[0];

  // Check if enabled
  if (credentials.is_enabled === false) {
    throw new Error("FastAPI is disabled for this user");
  }

  // Validate credentials
  if (!credentials.api_host || !credentials.api_port) {
    throw new Error("Invalid credentials: missing host or port");
  }

  const serviceUrl = `http://${credentials.api_host}:${credentials.api_port}`;

  try {
    // Attempt connection to Python FastAPI service using health endpoint
    const response = await axios.get(`${serviceUrl}/health`, {
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      throw new Error(`Connection failed with status: ${response.status}`);
    }

    // Update connection status in database
    await easysite.table.update({
      customTableID: FASTAPI_SETTINGS_TABLE_ID,
      update: {
        id: credentials.id,
        connection_status: 'connected',
        last_connected: new Date().toISOString()
      }
    });

    return {
      status: 'connected',
      host: credentials.api_host,
      port: credentials.api_port,
      serviceUrl: serviceUrl,
      account: credentials.account_id || '',
      connectedAt: new Date().toISOString(),
      serviceInfo: response.data
    };

  } catch (err) {
    // Update failure status
    await easysite.table.update({
      customTableID: FASTAPI_SETTINGS_TABLE_ID,
      update: {
        id: credentials.id,
        connection_status: 'failed',
        last_error: err.message
      }
    });

    if (err.code === 'ECONNABORTED') {
      throw new Error(`Connection timeout after ${timeout}ms`);
    }

    throw new Error(`Connection failed: ${err.message}`);
  }
}