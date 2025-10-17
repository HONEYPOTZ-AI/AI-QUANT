
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
  const CLIENT_ID = '18001_d63gVTSSDt3Axw3DCoT3FpQwy60ySNc1LRtRed7Z3SBXv6qmG2';
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
    case 'getAuthUrl': {
      // Generate OAuth authorization URL
      const { redirectUri, state } = params;
      if (!redirectUri) throw new Error('redirectUri is required');
      
      const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=trading&state=${state || 'ctrader_auth'}`;
      
      return { authUrl };
    }

    case 'exchangeToken': {
      // Exchange authorization code for access token
      const { code, redirectUri, userId } = params;
      if (!code || !redirectUri || !userId) {
        throw new Error('code, redirectUri, and userId are required');
      }

      try {
const response = await axios.post(TOKEN_URL, {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: CLIENT_ID
        }, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, expires_in, token_type } = response.data;
        
        // Calculate expiry time
        const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

        // Store tokens in database
        await saveSettings(userId, {
          access_token,
          refresh_token,
          token_type: token_type || 'Bearer',
          expires_at: expiresAt,
          client_id: CLIENT_ID
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

    case 'refreshToken': {
      // Refresh expired access token
      const { userId, refreshTokenOverride } = params;
      if (!userId) throw new Error('userId is required');

      const settings = await getSettings(userId);
      const refreshTokenToUse = refreshTokenOverride || settings?.refresh_token;
      
      if (!refreshTokenToUse) {
        throw new Error('No refresh token found. Please re-authenticate.');
      }

      try {
const response = await axios.post(TOKEN_URL, {
          grant_type: 'refresh_token',
          refresh_token: refreshTokenToUse,
          client_id: CLIENT_ID
        }, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, expires_in, token_type } = response.data;
        const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

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

    case 'getStoredToken': {
      // Retrieve stored token and check if it's valid
      const { userId } = params;
      if (!userId) throw new Error('userId is required');

      const settings = await getSettings(userId);
      if (!settings || !settings.access_token) {
        throw new Error('No stored token found. Please authenticate first.');
      }

      const now = new Date();
      const expiresAt = new Date(settings.expires_at);
      const isExpired = now >= expiresAt;

      // If token is expired, try to refresh it
      if (isExpired && settings.refresh_token) {
        return await ctraderAuthHandler('refreshToken', { userId });
      }

      return {
        accessToken: settings.access_token,
        refreshToken: settings.refresh_token,
        expiresAt: settings.expires_at,
        tokenType: settings.token_type || 'Bearer',
        isExpired
      };
    }

    case 'revokeToken': {
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

    case 'validateConnection': {
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
