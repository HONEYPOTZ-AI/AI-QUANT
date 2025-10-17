/**
 * Handle reconnection to IBRK API with exponential backoff
 * @param {number} userId - User ID to reconnect for
 * @param {Object} options - Reconnection options { maxRetries: 5, baseDelay: 1000 }
 * @returns {Object} Reconnection result
 */
async function ibrkReconnectHandler(userId, options = {}) {
  const { maxRetries = 5, baseDelay = 1000, maxDelay = 30000 } = options;
  const IBRK_SETTINGS_TABLE_ID = 51055;

  // Retrieve credentials
  const filters = userId ? [{
    name: "user_id",
    op: "Equal",
    value: userId
  }] : [];

  const { data, error } = await easysite.table.page({
    customTableID: IBRK_SETTINGS_TABLE_ID,
    pageFilter: {
      PageNo: 1,
      PageSize: 1,
      OrderByField: "id",
      IsAsc: false,
      Filters: filters
    }
  });

  if (error) {
    throw new Error(`Failed to retrieve credentials: ${error}`);
  }

  if (!data?.List || data.List.length === 0) {
    throw new Error("No IBRK API credentials found");
  }

  const settings = data.List[0];

  if (settings.is_enabled === false) {
    throw new Error("Cannot reconnect: IBRK API is disabled");
  }

  const connectionUrl = `http://${settings.api_host}:${settings.api_port}`;
  let lastError = null;

  // Attempt reconnection with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

      // Wait before retry (skip on first attempt)
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Update status to reconnecting
      await easysite.table.update({
        customTableID: IBRK_SETTINGS_TABLE_ID,
        update: {
          id: settings.id,
          connection_status: 'reconnecting',
          reconnect_attempt: attempt
        }
      });

      // Attempt connection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${connectionUrl}/v1/api/tickle`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Success! Update status
        await easysite.table.update({
          customTableID: IBRK_SETTINGS_TABLE_ID,
          update: {
            id: settings.id,
            connection_status: 'connected',
            last_connected: new Date().toISOString(),
            reconnect_attempt: 0,
            last_error: null
          }
        });

        return {
          success: true,
          status: 'connected',
          attempts: attempt,
          message: `Successfully reconnected after ${attempt} attempt(s)`,
          connectedAt: new Date().toISOString()
        };
      }

      lastError = `HTTP ${response.status}: ${response.statusText}`;

    } catch (err) {
      lastError = err.message;

      // Update error in database
      await easysite.table.update({
        customTableID: IBRK_SETTINGS_TABLE_ID,
        update: {
          id: settings.id,
          last_error: lastError,
          reconnect_attempt: attempt
        }
      });

      // If this is the last attempt, break
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  // All retries failed
  await easysite.table.update({
    customTableID: IBRK_SETTINGS_TABLE_ID,
    update: {
      id: settings.id,
      connection_status: 'failed',
      reconnect_attempt: 0
    }
  });

  throw new Error(`Reconnection failed after ${maxRetries} attempts. Last error: ${lastError}`);
}