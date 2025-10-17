
/**
 * cTrader OAuth Authentication Handler
 * Handles authentication flow, token management, and credential storage
 * 
 * Actions:
 * - getAuthUrl: Generate OAuth authorization URL
 * - exchangeToken: Exchange authorization code for access token
 * - refreshToken: Refresh expired access token
 * - getStoredToken: Retrieve stored token from database
 * - revokeToken: Revoke access token
 */

async function ctraderAuthHandler(action, params = {}) {
  const DEFAULT_CLIENT_ID = '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2';
  const DEFAULT_CLIENT_SECRET = '7P1GUL6X41TO37StUtlTIEyEtxvDtLZmqIYAimyahYrCvU5GVX';
  const AUTH_URL = 'https://openapi.ctrader.com/apps/auth';
  const TOKEN_URL = 'https://openapi.ctrader.com/apps/token';
  const TABLE_ID = 51256; // ctrader_api_settings

  // Helper to get settings from database
  async function getSettings(userId) {
    const { data, error } = await easysite.table.page(TABLE_ID, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });
    if (error) throw new Error(`Failed to fetch settings: ${error}`);
    return data?.List?.[0] || null;
  }

  // Helper to get client credentials
  async function getClientCredentials(userId) {
    const settings = await getSettings(userId);
    return {
      clientId: settings?.client_id || DEFAULT_CLIENT_ID,
      clientSecret: settings?.client_secret || DEFAULT_CLIENT_SECRET
    };
  }

  // Helper to save/update settings
  async function saveSettings(userId, settingsData) {
    const existing = await getSettings(userId);

    const payload = {
      user_id: userId,
      ...settingsData,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      payload.id = existing.id;
      const { error } = await easysite.table.update(TABLE_ID, payload);
      if (error) throw new Error(`Failed to update settings: ${error}`);
    } else {
      const { error } = await easysite.table.create(TABLE_ID, payload);
      if (error) throw new Error(`Failed to create settings: ${error}`);
    }
  }

  switch (action) {
    case 'getAuthUrl':{
        // Generate OAuth authorization URL
        const { redirectUri, state, userId } = params;
        if (!redirectUri) throw new Error('redirectUri is required');

        const { clientId } = userId ? await getClientCredentials(userId) : { clientId: DEFAULT_CLIENT_ID };

        const authUrl = `${AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=trading&state=${state || 'ctrader_auth'}`;

        return { authUrl };
      }

    case 'exchangeToken':{
        // Exchange authorization code for access token
        const { code, redirectUri, userId } = params;
        if (!code || !redirectUri || !userId) {
          throw new Error('code, redirectUri, and userId are required');
        }

        const { clientId, clientSecret } = await getClientCredentials(userId);

        try {
          const response = await axios.post(TOKEN_URL, {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
          }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });

          const { access_token, refresh_token, expires_in, token_type } = response.data;

          // Calculate expiry time
          const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

          // Store tokens in database
          await saveSettings(userId, {
            access_token,
            refresh_token,
            token_type: token_type || 'Bearer',
            expires_at: expiresAt,
            client_id: clientId,
            client_secret: clientSecret
          });

          return {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt,
            tokenType: token_type || 'Bearer'
          };
        } catch (error) {
          const errorMsg = error.response?.data?.error_description || error.message;
          throw new Error(`Token exchange failed: ${errorMsg}`);
        }
      }

    case 'refreshToken':{
        // Refresh expired access token
        const { userId, refreshTokenOverride } = params;
        if (!userId) throw new Error('userId is required');

        const { clientId, clientSecret } = await getClientCredentials(userId);
        const settings = await getSettings(userId);
        const refreshTokenToUse = refreshTokenOverride || settings?.refresh_token;

        if (!refreshTokenToUse) {
          throw new Error('No refresh token found. Please re-authenticate.');
        }

        try {
          const response = await axios.post(TOKEN_URL, {
            grant_type: 'refresh_token',
            refresh_token: refreshTokenToUse,
            client_id: clientId,
            client_secret: clientSecret
          }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });

          const { access_token, refresh_token, expires_in, token_type } = response.data;
          const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

          // Update tokens in database
          await saveSettings(userId, {
            access_token,
            refresh_token: refresh_token || refreshTokenToUse,
            token_type: token_type || 'Bearer',
            expires_at: expiresAt
          });

          return {
            accessToken: access_token,
            refreshToken: refresh_token || refreshTokenToUse,
            expiresAt,
            tokenType: token_type || 'Bearer'
          };
        } catch (error) {
          const errorMsg = error.response?.data?.error_description || error.message;
          throw new Error(`Token refresh failed: ${errorMsg}`);
        }
      }

    case 'getStoredToken':{
        // Retrieve stored token and check if it's valid
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        const settings = await getSettings(userId);
        if (!settings || !settings.access_token) {
          throw new Error('No stored token found. Please authenticate first.');
        }

        // If token_expires_in is set, calculate expiry time
        let isExpired = false;
        let expiresAt = settings.token_expiry || settings.expires_at;
        
        if (settings.token_expires_in && settings.last_connection_time) {
          const lastConnectionTime = new Date(settings.last_connection_time);
          const calculatedExpiry = new Date(lastConnectionTime.getTime() + settings.token_expires_in * 1000);
          expiresAt = calculatedExpiry.toISOString();
          isExpired = new Date() >= calculatedExpiry;
        } else if (settings.expires_at) {
          const now = new Date();
          const expiryDate = new Date(settings.expires_at);
          isExpired = now >= expiryDate;
        }

        // If token is expired and we have a refresh token, try to refresh it
        if (isExpired && settings.refresh_token) {
          return await ctraderAuthHandler('refreshToken', { userId });
        }

        return {
          accessToken: settings.access_token,
          refreshToken: settings.refresh_token,
          expiresAt: expiresAt,
          tokenType: settings.token_type || 'Bearer',
          isExpired
        };
      }

    case 'revokeToken':{
        // Revoke token and clear from database
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        const settings = await getSettings(userId);
        if (settings) {
          // Clear tokens from database
          await saveSettings(userId, {
            access_token: null,
            refresh_token: null,
            expires_at: null
          });
        }

        return { success: true, message: 'Token revoked successfully' };
      }

    case 'validateConnection':{
        // Validate if we have valid credentials
        const { userId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          const tokenInfo = await ctraderAuthHandler('getStoredToken', { userId });
          return {
            isValid: !!tokenInfo.accessToken && !tokenInfo.isExpired,
            tokenInfo
          };
        } catch (error) {
          return {
            isValid: false,
            error: error.message
          };
        }
      }

    default:
      throw new Error(`Unknown action: ${action}. Available actions: getAuthUrl, exchangeToken, refreshToken, getStoredToken, revokeToken, validateConnection`);
  }
}

module.exports = ctraderAuthHandler;