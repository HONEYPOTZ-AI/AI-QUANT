
/**
 * cTrader Connection Tester
 * Tests API connectivity and authentication using stored credentials
 * Returns detailed status including connection, authentication, and error information
 */

async function ctraderConnectionTester(userId) {
  const TABLE_ID = 51256; // ctrader_api_settings

  if (!userId) {
    throw new Error('userId is required');
  }

  const result = {
    success: false,
    authenticated: false,
    connected: false,
    timestamp: new Date().toISOString(),
    details: {
      credentialsFound: false,
      authenticationStatus: '',
      connectionStatus: '',
      accountCount: 0,
      accounts: []
    },
    errors: []
  };

  try {
    // Step 1: Check if credentials exist in database
    const { data: settingsData, error: settingsError } = await easysite.table.page(TABLE_ID, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (settingsError) {
      result.errors.push(`Failed to retrieve credentials: ${settingsError}`);
      throw new Error(`Database error: ${settingsError}`);
    }

    const settings = settingsData?.List?.[0];

    if (!settings || !settings.client_id || !settings.client_secret || !settings.access_token) {
      result.errors.push('No credentials found. Please save your Client ID, Client Secret, and Access Token first.');
      result.details.authenticationStatus = 'No credentials stored';
      throw new Error('Missing credentials');
    }

    result.details.credentialsFound = true;
    result.details.authenticationStatus = 'Credentials found (including Access Token)';

    // Step 2: Validate access token is present
    try {
      if (!settings.access_token) {
        result.errors.push('No access token found. Please save your Access Token in settings.');
        result.details.authenticationStatus = 'No access token';
        throw new Error('Access token required');
      }

      // Check if token might be expired based on token_expires_in
      if (settings.token_expires_in && settings.last_connection_time) {
        const lastConnectionTime = new Date(settings.last_connection_time);
        const calculatedExpiry = new Date(lastConnectionTime.getTime() + settings.token_expires_in * 1000);
        const isExpired = new Date() >= calculatedExpiry;
        
        if (isExpired) {
          result.errors.push('Access token may be expired. Please update your Access Token.');
          result.details.authenticationStatus = 'Token expired';
          result.authenticated = false;
        } else {
          result.authenticated = true;
          result.details.authenticationStatus = 'Access token valid';
        }
      } else {
        result.authenticated = true;
        result.details.authenticationStatus = 'Access token present';
      }

    } catch (authError) {
      result.errors.push(`Authentication error: ${authError.message}`);
      result.details.authenticationStatus = `Error: ${authError.message}`;
      throw authError;
    }

    // Step 3: Test API connectivity by fetching accounts
    try {
      const { data: connectionData, error: connectionError } = await easysite.run({
        path: '__easysite_nodejs__/ctraderConnectionManager.js',
        param: ['testConnection', { userId, retries: 2, delayMs: 1000 }]
      });

      if (connectionError) {
        result.errors.push(`Connection test failed: ${connectionError}`);
        result.details.connectionStatus = `Failed: ${connectionError}`;
        throw new Error(connectionError);
      }

      result.connected = true;
      result.details.connectionStatus = 'API accessible';
      result.details.accountCount = connectionData?.accounts?.length || 0;
      result.details.accounts = connectionData?.accounts || [];
      result.success = true;

      // Update connection status in database
      if (settings.id) {
        await easysite.table.update(TABLE_ID, {
          id: settings.id,
          is_connected: true,
          last_connection_time: result.timestamp
        });
      }

    } catch (connError) {
      result.errors.push(`Connection error: ${connError.message}`);
      result.details.connectionStatus = `Failed: ${connError.message}`;
      throw connError;
    }

  } catch (error) {
    // Final catch for any unhandled errors
    if (result.errors.length === 0) {
      result.errors.push(error.message || 'Unknown error occurred');
    }
  }

  return result;
}

module.exports = ctraderConnectionTester;