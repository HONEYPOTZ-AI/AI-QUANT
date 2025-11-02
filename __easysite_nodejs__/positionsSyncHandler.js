
async function syncAllPositions() {
  const results = {
    ibrk: { success: false, count: 0, error: null },
    ctrader: { success: false, count: 0, error: null }
  };

  // Fetch positions from IBRK
  try {
    const ibrkData = await easysite.run({
      path: "__easysite_nodejs__/ibrkPositionsFetcher.js",
      param: []
    });

    if (!ibrkData.error && ibrkData.data?.positions) {
      const positions = ibrkData.data.positions;

      for (const pos of positions) {
        // Check if position already exists
        const { data: existingData } = await easysite.table.page(56078, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: "broker", op: "Equal", value: "IBRK" },
          { name: "position_id", op: "Equal", value: pos.positionId },
          { name: "status", op: "Equal", value: "OPEN" }]

        });

        const positionData = {
          broker: "IBRK",
          position_id: pos.positionId,
          symbol: pos.symbol,
          position_type: pos.positionType,
          quantity: pos.quantity,
          entry_price: pos.entryPrice,
          current_price: pos.currentPrice,
          unrealized_pnl: pos.unrealizedPnL,
          realized_pnl: 0,
          commission: pos.commission,
          status: "OPEN",
          open_time: pos.openTime,
          updated_at: new Date().toISOString()
        };

        if (existingData?.List && existingData.List.length > 0) {
          // Update existing position
          positionData.id = existingData.List[0].id;
          await easysite.table.update(56078, positionData);
        } else {
          // Create new position
          await easysite.table.create(56078, positionData);
        }
        results.ibrk.count++;
      }
      results.ibrk.success = true;
    }
  } catch (error) {
    results.ibrk.error = error.message;
  }

  // Fetch positions from cTrader
  try {
    const ctraderData = await easysite.run({
      path: "__easysite_nodejs__/ctraderPositionsFetcher.js",
      param: []
    });

    if (!ctraderData.error && ctraderData.data?.positions) {
      const positions = ctraderData.data.positions;

      for (const pos of positions) {
        // Check if position already exists
        const { data: existingData } = await easysite.table.page(56078, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: "broker", op: "Equal", value: "cTrader" },
          { name: "position_id", op: "Equal", value: pos.positionId },
          { name: "status", op: "Equal", value: "OPEN" }]

        });

        const positionData = {
          broker: "cTrader",
          position_id: pos.positionId,
          symbol: pos.symbol,
          position_type: pos.positionType,
          quantity: pos.quantity,
          entry_price: pos.entryPrice,
          current_price: pos.currentPrice,
          unrealized_pnl: pos.unrealizedPnL,
          realized_pnl: 0,
          commission: pos.commission,
          status: "OPEN",
          open_time: pos.openTime,
          updated_at: new Date().toISOString()
        };

        if (existingData?.List && existingData.List.length > 0) {
          // Update existing position
          positionData.id = existingData.List[0].id;
          await easysite.table.update(56078, positionData);
        } else {
          // Create new position
          await easysite.table.create(56078, positionData);
        }
        results.ctrader.count++;
      }
      results.ctrader.success = true;
    }
  } catch (error) {
    results.ctrader.error = error.message;
  }

  return {
    success: results.ibrk.success || results.ctrader.success,
    results: results,
    timestamp: new Date().toISOString()
  };
}