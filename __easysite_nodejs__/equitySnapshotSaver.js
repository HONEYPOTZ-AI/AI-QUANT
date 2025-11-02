
async function saveEquitySnapshot(broker = "ALL") {
  let equityData = {
    equityBalance: 0,
    cashBalance: 0,
    marginUsed: 0,
    availableMargin: 0,
    unrealizedPnL: 0
  };

  // Fetch equity from both brokers if ALL, otherwise specific broker
  if (broker === "ALL" || broker === "IBRK") {
    try {
      const ibrkEquity = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/ibrkEquityFetcher.js",
        param: []
      });

      if (!ibrkEquity.error && ibrkEquity.data) {
        equityData.equityBalance += ibrkEquity.data.equityBalance;
        equityData.cashBalance += ibrkEquity.data.cashBalance;
        equityData.marginUsed += ibrkEquity.data.marginUsed;
        equityData.availableMargin += ibrkEquity.data.availableMargin;
        equityData.unrealizedPnL += ibrkEquity.data.unrealizedPnL;
      }
    } catch (error) {
      console.error("Failed to fetch IBRK equity:", error.message);
    }
  }

  if (broker === "ALL" || broker === "cTrader") {
    try {
      const ctraderEquity = await window.ezsite.apis.run({
        path: "__easysite_nodejs__/ctraderEquityFetcher.js",
        param: []
      });

      if (!ctraderEquity.error && ctraderEquity.data) {
        equityData.equityBalance += ctraderEquity.data.equityBalance;
        equityData.cashBalance += ctraderEquity.data.cashBalance;
        equityData.marginUsed += ctraderEquity.data.marginUsed;
        equityData.availableMargin += ctraderEquity.data.availableMargin;
        equityData.unrealizedPnL += ctraderEquity.data.unrealizedPnL;
      }
    } catch (error) {
      console.error("Failed to fetch cTrader equity:", error.message);
    }
  }

  // Fetch previous high watermark
  const { data: prevSnapshot } = await easysite.table.page(56080, {
    PageNo: 1,
    PageSize: 1,
    OrderByField: "high_watermark",
    IsAsc: false,
    Filters: [
    { name: "broker", op: "Equal", value: broker }]

  });

  const prevHighWatermark = prevSnapshot?.List?.[0]?.high_watermark || 0;
  const highWatermark = Math.max(equityData.equityBalance, prevHighWatermark);

  // Save snapshot
  const snapshotData = {
    snapshot_date: new Date().toISOString(),
    broker: broker,
    equity_balance: equityData.equityBalance,
    cash_balance: equityData.cashBalance,
    margin_used: equityData.marginUsed,
    available_margin: equityData.availableMargin,
    unrealized_pnl: equityData.unrealizedPnL,
    high_watermark: highWatermark
  };

  const { error } = await easysite.table.create(56080, snapshotData);

  if (error) {
    throw new Error("Failed to save equity snapshot: " + error);
  }

  return {
    success: true,
    snapshot: snapshotData,
    timestamp: new Date().toISOString()
  };
}