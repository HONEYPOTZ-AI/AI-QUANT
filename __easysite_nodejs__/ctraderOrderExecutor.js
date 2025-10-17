
/**
 * cTrader Order Executor
 * Executes trades (buy/sell orders) through cTrader API
 * 
 * Actions:
 * - placeMarketOrder: Place a market order (buy/sell at current price)
 * - placeLimitOrder: Place a limit order (buy/sell at specific price)
 * - placeStopOrder: Place a stop order
 * - modifyOrder: Modify an existing order
 * - cancelOrder: Cancel a pending order
 * - closePosition: Close an open position
 * - getOrders: Get all orders
 * - getPositions: Get all open positions
 * - getOrderStatus: Get status of a specific order
 */

async function ctraderOrderExecutor(action, params = {}) {
  const API_BASE_URL = 'https://api.ctrader.com';
  const API_VERSION = 'v3';
  const TABLE_ID = 51256; // ctrader_api_settings

  // Helper to get access token from database
  async function getAccessToken(userId) {
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

  // Helper to get account ID
  async function getAccountId(userId) {
    const { data, error } = await easysite.table.page(TABLE_ID, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (error) throw new Error(`Failed to fetch account ID: ${error}`);
    const accountId = data?.List?.[0]?.account_id;
    if (!accountId) throw new Error('No account ID configured. Please connect your account first.');
    return accountId;
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
      },
      timeout: 30000
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
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

  // Validate order parameters
  function validateOrderParams(params) {
    const { symbol, volume, side } = params;

    if (!symbol) throw new Error('symbol is required');
    if (!volume || volume <= 0) throw new Error('volume must be greater than 0');
    if (!side || !['BUY', 'SELL'].includes(side.toUpperCase())) {
      throw new Error('side must be either BUY or SELL');
    }
  }

  switch (action) {
    case 'placeMarketOrder':{
        // Place a market order
        const { userId, symbol, volume, side, stopLoss, takeProfit, label, accountId } = params;
        if (!userId) throw new Error('userId is required');
        validateOrderParams({ symbol, volume, side });

        const accId = accountId || (await getAccountId(userId));

        const orderPayload = {
          symbolName: symbol,
          tradeSide: side.toUpperCase(),
          volume: volume,
          orderType: 'MARKET'
        };

        if (stopLoss) orderPayload.stopLoss = stopLoss;
        if (takeProfit) orderPayload.takeProfit = takeProfit;
        if (label) orderPayload.label = label;

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/orders`,
          'POST',
          orderPayload
        );

        return {
          orderId: result?.orderId,
          symbol,
          side,
          volume,
          orderType: 'MARKET',
          status: result?.status || 'PLACED',
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'placeLimitOrder':{
        // Place a limit order
        const { userId, symbol, volume, side, limitPrice, stopLoss, takeProfit, label, expiryTime, accountId } = params;
        if (!userId) throw new Error('userId is required');
        validateOrderParams({ symbol, volume, side });
        if (!limitPrice || limitPrice <= 0) throw new Error('limitPrice is required for limit orders');

        const accId = accountId || (await getAccountId(userId));

        const orderPayload = {
          symbolName: symbol,
          tradeSide: side.toUpperCase(),
          volume: volume,
          orderType: 'LIMIT',
          limitPrice: limitPrice
        };

        if (stopLoss) orderPayload.stopLoss = stopLoss;
        if (takeProfit) orderPayload.takeProfit = takeProfit;
        if (label) orderPayload.label = label;
        if (expiryTime) orderPayload.expiryTime = expiryTime;

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/orders`,
          'POST',
          orderPayload
        );

        return {
          orderId: result?.orderId,
          symbol,
          side,
          volume,
          limitPrice,
          orderType: 'LIMIT',
          status: result?.status || 'PENDING',
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'placeStopOrder':{
        // Place a stop order
        const { userId, symbol, volume, side, stopPrice, stopLoss, takeProfit, label, accountId } = params;
        if (!userId) throw new Error('userId is required');
        validateOrderParams({ symbol, volume, side });
        if (!stopPrice || stopPrice <= 0) throw new Error('stopPrice is required for stop orders');

        const accId = accountId || (await getAccountId(userId));

        const orderPayload = {
          symbolName: symbol,
          tradeSide: side.toUpperCase(),
          volume: volume,
          orderType: 'STOP',
          stopPrice: stopPrice
        };

        if (stopLoss) orderPayload.stopLoss = stopLoss;
        if (takeProfit) orderPayload.takeProfit = takeProfit;
        if (label) orderPayload.label = label;

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/orders`,
          'POST',
          orderPayload
        );

        return {
          orderId: result?.orderId,
          symbol,
          side,
          volume,
          stopPrice,
          orderType: 'STOP',
          status: result?.status || 'PENDING',
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'modifyOrder':{
        // Modify an existing order
        const { userId, orderId, limitPrice, stopPrice, stopLoss, takeProfit, expiryTime, accountId } = params;
        if (!userId || !orderId) throw new Error('userId and orderId are required');

        const accId = accountId || (await getAccountId(userId));

        const updatePayload = {};
        if (limitPrice !== undefined) updatePayload.limitPrice = limitPrice;
        if (stopPrice !== undefined) updatePayload.stopPrice = stopPrice;
        if (stopLoss !== undefined) updatePayload.stopLoss = stopLoss;
        if (takeProfit !== undefined) updatePayload.takeProfit = takeProfit;
        if (expiryTime !== undefined) updatePayload.expiryTime = expiryTime;

        if (Object.keys(updatePayload).length === 0) {
          throw new Error('At least one parameter to modify must be provided');
        }

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/orders/${orderId}`,
          'PATCH',
          updatePayload
        );

        return {
          orderId,
          modified: true,
          updates: updatePayload,
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'cancelOrder':{
        // Cancel a pending order
        const { userId, orderId, accountId } = params;
        if (!userId || !orderId) throw new Error('userId and orderId are required');

        const accId = accountId || (await getAccountId(userId));

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/orders/${orderId}`,
          'DELETE'
        );

        return {
          orderId,
          cancelled: true,
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'closePosition':{
        // Close an open position
        const { userId, positionId, volume, accountId } = params;
        if (!userId || !positionId) throw new Error('userId and positionId are required');

        const accId = accountId || (await getAccountId(userId));

        const closePayload = {};
        if (volume) closePayload.volume = volume; // Partial close if volume specified

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/positions/${positionId}/close`,
          'POST',
          closePayload
        );

        return {
          positionId,
          closed: true,
          volume: volume || 'full',
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    case 'getOrders':{
        // Get all orders (pending and executed)
        const { userId, status, accountId } = params;
        if (!userId) throw new Error('userId is required');

        const accId = accountId || (await getAccountId(userId));

        let endpoint = `/accounts/${accId}/orders`;
        if (status) endpoint += `?status=${status}`;

        const orders = await makeApiRequest(userId, endpoint);

        return {
          orders: orders || [],
          count: orders?.length || 0,
          timestamp: new Date().toISOString()
        };
      }

    case 'getPositions':{
        // Get all open positions
        const { userId, accountId } = params;
        if (!userId) throw new Error('userId is required');

        const accId = accountId || (await getAccountId(userId));

        const positions = await makeApiRequest(userId, `/accounts/${accId}/positions`);

        return {
          positions: positions || [],
          count: positions?.length || 0,
          timestamp: new Date().toISOString()
        };
      }

    case 'getOrderStatus':{
        // Get status of a specific order
        const { userId, orderId, accountId } = params;
        if (!userId || !orderId) throw new Error('userId and orderId are required');

        const accId = accountId || (await getAccountId(userId));

        const order = await makeApiRequest(userId, `/accounts/${accId}/orders/${orderId}`);

        return {
          orderId,
          status: order?.status,
          order,
          timestamp: new Date().toISOString()
        };
      }

    case 'getPositionById':{
        // Get details of a specific position
        const { userId, positionId, accountId } = params;
        if (!userId || !positionId) throw new Error('userId and positionId are required');

        const accId = accountId || (await getAccountId(userId));

        const position = await makeApiRequest(userId, `/accounts/${accId}/positions/${positionId}`);

        return {
          positionId,
          position,
          timestamp: new Date().toISOString()
        };
      }

    case 'modifyPosition':{
        // Modify position's stop loss or take profit
        const { userId, positionId, stopLoss, takeProfit, accountId } = params;
        if (!userId || !positionId) throw new Error('userId and positionId are required');

        const accId = accountId || (await getAccountId(userId));

        const updatePayload = {};
        if (stopLoss !== undefined) updatePayload.stopLoss = stopLoss;
        if (takeProfit !== undefined) updatePayload.takeProfit = takeProfit;

        if (Object.keys(updatePayload).length === 0) {
          throw new Error('At least stopLoss or takeProfit must be provided');
        }

        const result = await makeApiRequest(
          userId,
          `/accounts/${accId}/positions/${positionId}`,
          'PATCH',
          updatePayload
        );

        return {
          positionId,
          modified: true,
          updates: updatePayload,
          timestamp: new Date().toISOString(),
          data: result
        };
      }

    default:
      throw new Error(`Unknown action: ${action}. Available actions: placeMarketOrder, placeLimitOrder, placeStopOrder, modifyOrder, cancelOrder, closePosition, getOrders, getPositions, getOrderStatus, getPositionById, modifyPosition`);
  }
}

module.exports = ctraderOrderExecutor;