import axios from "npm:axios@1.6.5";

/**
 * Fetch equity information from Python FastAPI service via HTTP
 * @param {string} accountId - Account ID (optional)
 * @returns {Object} Account equity and balance information
 */
export async function fetchFastAPIEquity(accountId = null) {
  // Fetch FastAPI settings
  const { data: settingsData, error: settingsError } = await easysite.table.page(51055, {
    PageNo: 1,
    PageSize: 1,
    OrderByField: "ID",
    IsAsc: false
  });

  if (settingsError) {
    throw new Error("Failed to fetch FastAPI settings: " + settingsError);
  }

  if (!settingsData?.List || settingsData.List.length === 0) {
    throw new Error("FastAPI settings not configured");
  }

  const settings = settingsData.List[0];

  if (!settings.api_host || !settings.api_port) {
    throw new Error("Invalid FastAPI settings: missing host or port");
  }

  const serviceUrl = `http://${settings.api_host}:${settings.api_port}`;

  try {
    // Call Python FastAPI service
    const response = await axios.get(`${serviceUrl}/equity`, {
      params: {
        account_id: accountId || settings.account_id
      },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.success) {
      throw new Error('Failed to fetch equity from Python service');
    }

    const equityData = response.data.data;

    return {
      broker: equityData.broker,
      accountId: equityData.account_id,
      equityBalance: equityData.equity_balance,
      cashBalance: equityData.cash_balance,
      marginUsed: equityData.margin_used,
      availableMargin: equityData.available_margin,
      unrealizedPnL: equityData.unrealized_pnl,
      marginLevel: equityData.margin_level,
      timestamp: equityData.timestamp
    };

  } catch (error) {
    console.error('FastAPI equity fetch error:', error.message);
    
    // Return fallback data if service fails
    return {
      broker: "FastAPI",
      accountId: accountId || "DEFAULT",
      equityBalance: 50000.00,
      cashBalance: 50000.00,
      marginUsed: 0.00,
      availableMargin: 50000.00,
      unrealizedPnL: 0.00,
      marginLevel: 100.00,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }
}