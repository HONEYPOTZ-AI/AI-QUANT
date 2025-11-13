/**
 * Establish connection to FastAPI with authentication
 * @param {number} userId - User ID to connect for
 * @param {Object} options - Connection options { timeout: 10000, validate: true }
 * @returns {Object} Connection result with status and details
 */
async function fastapiConnectionManager(userId, options = {}) {
  const { timeout = 10000, validate = true } = options;

  // Import credentials handler (simulate by calling it)
  const FASTAPI_SETTINGS_TABLE_ID = 51055;

  // Retrieve credentials
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

  const connectionUrl = `http://${credentials.api_host}:${credentials.api_port}`;
  const clientId = credentials.client_id || 1;

  try {
    // Attempt connection to FastAPI Gateway
    // Using the /v1/api/tickle endpoint to verify connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${connectionUrl}/v1/api/tickle`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Connection failed with status: ${response.status}`);
    }

    const result = await response.json();

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
      clientId: clientId,
      account: credentials.account_id || '',
      connectedAt: new Date().toISOString(),
      sessionId: result.session || null
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

    if (err.name === 'AbortError') {
      throw new Error(`Connection timeout after ${timeout}ms`);
    }

    throw new Error(`Connection failed: ${err.message}`);
  }
}