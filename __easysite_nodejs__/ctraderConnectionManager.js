
/**
 * cTrader Connection Manager
 * Manages connections to cTrader API, handles reconnection logic
 * 
 * Actions:
 * - connect: Establish connection to cTrader API
 * - disconnect: Close connection
 * - getStatus: Get current connection status
 * - testConnection: Test API connectivity
 */

async function ctraderConnectionManager(action, params = {}) {
  const API_BASE_URL = 'https://api.ctrader.com';
  const API_VERSION = 'v3';

  // Helper to get valid access token from database
  async function getAccessToken(userId) {
    const TABLE_ID = 51256; // ctrader_api_settings

    const { data, error } = await easysite.table.page(TABLE_ID, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (error) throw new Error(`Failed to fetch access token: ${error}`);

    const settings = data?.List?.[0];
    if (!settings || !settings.access_token) {
      throw new Error('No access token found. Please save your Access Token in settings.');
    }

    return settings.access_token;
  }

  // Helper to make authenticated API request
  async function makeApiRequest(userId, endpoint, method = 'GET', body = null) {
    const accessToken = await getAccessToken(userId);
    const config = {
      method,
      url: `${API_BASE_URL}/${API_VERSION}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
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
    case 'connect':{
        // Establish connection to cTrader API
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          // Validate token first
          const accessToken = await getAccessToken(userId);

          // Test connection by fetching accounts
          const accounts = await makeApiRequest(userId, '/accounts');

          return {
            connected: true,
            timestamp: new Date().toISOString(),
            accountCount: accounts?.length || 0,
            accounts: accounts || []
          };
        } catch (error) {
          throw new Error(`Connection failed: ${error.message}`);
        }
      }

    case 'disconnect':{
        // Gracefully disconnect (mainly a status update)
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        return {
          connected: false,
          timestamp: new Date().toISOString(),
          message: 'Disconnected from cTrader API'
        };
      }

    case 'getStatus':{
        // Get current connection status
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          // Check if we have valid credentials
          const { data: authData } = await window.ezsite.apis.run({
            path: '__easysite_nodejs__/ctraderAuthHandler.js',
            param: ['validateConnection', { userId }]
          });

          if (!authData?.isValid) {
            return {
              status: 'disconnected',
              authenticated: false,
              message: 'No valid authentication token'
            };
          }

          // Try to ping the API
          try {
            await makeApiRequest(userId, '/accounts');
            return {
              status: 'connected',
              authenticated: true,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            return {
              status: 'error',
              authenticated: true,
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          return {
            status: 'disconnected',
            authenticated: false,
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }

    case 'testConnection':{
        // Test API connectivity with retry logic
        const { userId, retries = 3, delayMs = 1000 } = params;
        if (!userId) throw new Error('userId is required');

        let lastError = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            const accounts = await makeApiRequest(userId, '/accounts');

            return {
              success: true,
              attempt,
              accounts: accounts || [],
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            lastError = error;

            if (attempt < retries) {
              // Exponential backoff
              const delay = delayMs * Math.pow(2, attempt - 1);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        throw new Error(`Connection test failed after ${retries} attempts: ${lastError.message}`);
      }

    case 'reconnect':{
        // Attempt to reconnect with exponential backoff
        const { userId, maxRetries = 5 } = params;
        if (!userId) throw new Error('userId is required');

        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Try to refresh token first
            await window.ezsite.apis.run({
              path: '__easysite_nodejs__/ctraderAuthHandler.js',
              param: ['refreshToken', { userId }]
            });

            // Test connection
            const result = await ctraderConnectionManager('connect', { userId });

            return {
              reconnected: true,
              attempt,
              ...result
            };
          } catch (error) {
            lastError = error;

            if (attempt < maxRetries) {
              // Exponential backoff: 1s, 2s, 4s, 8s, 16s
              const delay = 1000 * Math.pow(2, attempt - 1);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        throw new Error(`Reconnection failed after ${maxRetries} attempts: ${lastError.message}`);
      }

    case 'getAccounts':{
        // Get available trading accounts
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        const accounts = await makeApiRequest(userId, '/accounts');

        return {
          accounts: accounts || [],
          count: accounts?.length || 0,
          timestamp: new Date().toISOString()
        };
      }

    default:
      throw new Error(`Unknown action: ${action}. Available actions: connect, disconnect, getStatus, testConnection, reconnect, getAccounts`);
  }
}

module.exports = ctraderConnectionManager;