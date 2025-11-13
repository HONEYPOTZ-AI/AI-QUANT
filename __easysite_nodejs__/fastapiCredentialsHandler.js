/**
 * Retrieve FastAPI credentials from database
 * @param {number} userId - User ID to retrieve credentials for (optional, gets first if not provided)
 * @returns {Object} API credentials including host, port, clientId, account
 */
async function fastapiCredentialsHandler(userId = null) {
  const FASTAPI_SETTINGS_TABLE_ID = 51055;

  // Build filters based on whether userId is provided
  const filters = userId ? [{
    name: "user_id",
    op: "Equal",
    value: userId
  }] : [];

  // Retrieve credentials from database
  const { data, error } = await easysite.table.page({
    customTableID: FASTAPI_SETTINGS_TABLE_ID,
    pageFilter: {
      PageNo: 1,
      PageSize: 1,
      OrderByField: "id",
      IsAsc: false,
      Filters: filters
    }
  });

  if (error) {
    throw new Error(`Failed to retrieve FastAPI credentials: ${error}`);
  }

  if (!data?.List || data.List.length === 0) {
    throw new Error("No FastAPI credentials found in database");
  }

  const settings = data.List[0];

  // Validate required fields
  if (!settings.api_host || !settings.api_port) {
    throw new Error("Invalid FastAPI credentials: missing host or port");
  }

  return {
    id: settings.id,
    host: settings.api_host,
    port: settings.api_port,
    clientId: settings.client_id || 1,
    account: settings.account_id || '',
    userId: settings.user_id,
    isEnabled: settings.is_enabled !== false
  };
}