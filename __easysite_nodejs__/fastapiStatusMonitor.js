/**
 * Monitor and check FastAPI connection status
 * @param {number} userId - User ID to check status for
 * @returns {Object} Current connection status and health info
 */
async function fastapiStatusMonitor(userId) {
  const FASTAPI_SETTINGS_TABLE_ID = 51055;

  // Retrieve current settings
  const filters = userId ? [{
    name: "user_id",
    op: "Equal",
    value: userId
  }] : [];

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
    throw new Error(`Failed to retrieve status: ${error}`);
  }

  if (!data?.List || data.List.length === 0) {
    return {
      status: 'not_configured',
      message: 'No FastAPI settings found'
    };
  }

  const settings = data.List[0];

  // Check if enabled
  if (settings.is_enabled === false) {
    return {
      status: 'disabled',
      message: 'FastAPI is disabled',
      lastConnected: settings.last_connected || null
    };
  }

  const connectionUrl = `http://${settings.api_host}:${settings.api_port}`;

  // Perform health check
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${connectionUrl}/v1/api/tickle`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;
    const currentStatus = isHealthy ? 'connected' : 'unhealthy';

    // Update status if changed
    if (settings.connection_status !== currentStatus) {
      await easysite.table.update({
        customTableID: FASTAPI_SETTINGS_TABLE_ID,
        update: {
          id: settings.id,
          connection_status: currentStatus,
          last_checked: new Date().toISOString()
        }
      });
    }

    return {
      status: currentStatus,
      host: settings.api_host,
      port: settings.api_port,
      lastConnected: settings.last_connected || null,
      lastChecked: new Date().toISOString(),
      healthy: isHealthy,
      responseTime: response.headers.get('x-response-time') || null
    };

  } catch (err) {
    // Connection failed
    await easysite.table.update({
      customTableID: FASTAPI_SETTINGS_TABLE_ID,
      update: {
        id: settings.id,
        connection_status: 'disconnected',
        last_error: err.message,
        last_checked: new Date().toISOString()
      }
    });

    return {
      status: 'disconnected',
      message: `Connection check failed: ${err.message}`,
      lastConnected: settings.last_connected || null,
      lastError: err.message,
      healthy: false
    };
  }
}