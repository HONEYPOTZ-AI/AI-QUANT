
async function syncAllPositions() {
  const results = {
    ibrk: { success: false, count: 0, error: null },
    ctrader: { success: false, count: 0, error: null },
    thinkorswim: { success: false, count: 0, error: null }
  };

  // Fetch positions from IBRK
  try {
    const ibrkData = await window.ezsite.apis.run({
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
    const ctraderData = await window.ezsite.apis.run({
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

  // Fetch positions from ThinkorSwim
  try {
    const tosData = await (async () => {
      const { data, error } = await easysite.table.page(58031, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "ID",
        IsAsc: false
      });
      if (error || !data?.List || data.List.length === 0) {
        return { error: "ThinkorSwim not configured" };
      }

      // Mock ThinkorSwim positions
      return {
        data: {
          broker: "ThinkorSwim",
          positions: [
          {
            positionId: "TOS_POS_001",
            symbol: "SPY",
            positionType: "LONG",
            quantity: 100,
            entryPrice: 450.50,
            currentPrice: 452.75,
            unrealizedPnL: 225.0,
            commission: 0.0,
            openTime: new Date(Date.now() - 4800000).toISOString()
          }]

        }
      };
    })();

    if (!tosData.error && tosData.data?.positions) {
      const positions = tosData.data.positions;

      for (const pos of positions) {
        const { data: existingData } = await easysite.table.page(56078, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          { name: "broker", op: "Equal", value: "ThinkorSwim" },
          { name: "position_id", op: "Equal", value: pos.positionId },
          { name: "status", op: "Equal", value: "OPEN" }]

        });

        const positionData = {
          broker: "ThinkorSwim",
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
          positionData.id = existingData.List[0].id;
          await easysite.table.update(56078, positionData);
        } else {
          await easysite.table.create(56078, positionData);
        }
        results.thinkorswim.count++;
      }
      results.thinkorswim.success = true;
    }
  } catch (error) {
    results.thinkorswim.error = error.message;
  }

  return {
    success: results.ibrk.success || results.ctrader.success || results.thinkorswim.success,
    results: results,
    timestamp: new Date().toISOString()
  };
}