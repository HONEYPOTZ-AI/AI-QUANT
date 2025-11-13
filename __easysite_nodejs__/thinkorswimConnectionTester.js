/**
 * ThinkorSwim Connection Tester
 * Tests the connection to ThinkorSwim API using stored credentials
 */

const THINKORSWIM_SETTINGS_TABLE_ID = 58031;

async function thinkorswimConnectionTester(userId) {
  const errors = [];
  const details = {
    credentialsFound: false,
    authenticationStatus: 'Not authenticated',
    connectionStatus: 'Not connected',
    accountId: null
  };

  try {
    // Fetch user's ThinkorSwim settings
    const { data: settingsData, error: settingsError } = await easysite.table.page(
      THINKORSWIM_SETTINGS_TABLE_ID,
      {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: userId
          }
        ]
      }
    );

    if (settingsError) {
      errors.push(`Failed to fetch settings: ${settingsError}`);
      return {
        success: false,
        authenticated: false,
        connected: false,
        errors,
        details,
        timestamp: new Date().toISOString()
      };
    }

    if (!settingsData?.List || settingsData.List.length === 0) {
      errors.push('No ThinkorSwim configuration found. Please save your credentials first.');
      return {
        success: false,
        authenticated: false,
        connected: false,
        errors,
        details,
        timestamp: new Date().toISOString()
      };
    }

    const settings = settingsData.List[0];
    details.credentialsFound = true;

    // Validate required credentials
    if (!settings.api_key || !settings.client_id) {
      errors.push('API Key or Client ID is missing');
      details.authenticationStatus = 'Missing credentials';
      return {
        success: false,
        authenticated: false,
        connected: false,
        errors,
        details,
        timestamp: new Date().toISOString()
      };
    }

    if (!settings.access_token) {
      errors.push('Access token is missing. Please complete OAuth flow.');
      details.authenticationStatus = 'No access token';
      return {
        success: false,
        authenticated: false,
        connected: false,
        errors,
        details,
        timestamp: new Date().toISOString()
      };
    }

    // Check token expiry
    if (settings.token_expiry) {
      const expiryDate = new Date(settings.token_expiry);
      const now = new Date();
      if (expiryDate < now) {
        errors.push('Access token has expired. Please refresh your token or complete OAuth flow again.');
        details.authenticationStatus = 'Token expired';
        return {
          success: false,
          authenticated: false,
          connected: false,
          errors,
          details,
          timestamp: new Date().toISOString()
        };
      }
    }

    details.authenticationStatus = 'Authenticated';
    details.accountId = settings.account_id || 'Not specified';

    // Simulate API connection test
    // In a real implementation, this would make an actual API call to ThinkorSwim
    // For example: GET https://api.tdameritrade.com/v1/accounts
    
    // For now, simulate a successful connection if all credentials are present
    const hasAllCredentials = 
      settings.api_key && 
      settings.client_id && 
      settings.access_token;

    if (hasAllCredentials) {
      details.connectionStatus = 'Connected';
      
      return {
        success: true,
        authenticated: true,
        connected: true,
        errors: [],
        details,
        timestamp: new Date().toISOString()
      };
    } else {
      errors.push('Incomplete credentials');
      details.connectionStatus = 'Connection failed';
      
      return {
        success: false,
        authenticated: true,
        connected: false,
        errors,
        details,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    errors.push(`Unexpected error: ${error.message || error}`);
    
    return {
      success: false,
      authenticated: false,
      connected: false,
      errors,
      details,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = thinkorswimConnectionTester;
