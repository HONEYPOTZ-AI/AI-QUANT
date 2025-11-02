
async function getEquityHistoricalData(broker = "ALL", days = 30) {
  const startDate = dayjs().subtract(days, 'day').toISOString();

  const filters = [
  { name: "snapshot_date", op: "GreaterThanOrEqual", value: startDate }];


  if (broker !== "ALL") {
    filters.push({ name: "broker", op: "Equal", value: broker });
  }

  const { data, error } = await easysite.table.page(56080, {
    PageNo: 1,
    PageSize: days,
    OrderByField: "snapshot_date",
    IsAsc: true,
    Filters: filters
  });

  if (error) {
    throw new Error("Failed to fetch historical equity data: " + error);
  }

  const snapshots = data?.List || [];

  // Calculate starting equity and change
  const startingEquity = snapshots.length > 0 ? snapshots[0].equity_balance : 0;
  const currentEquity = snapshots.length > 0 ? snapshots[snapshots.length - 1].equity_balance : 0;
  const change = currentEquity - startingEquity;
  const changePercent = startingEquity > 0 ? change / startingEquity * 100 : 0;
  const highWatermark = Math.max(...snapshots.map((s) => s.equity_balance || 0), 0);

  return {
    broker: broker,
    days: days,
    startingEquity: startingEquity,
    currentEquity: currentEquity,
    change: change,
    changePercent: changePercent,
    highWatermark: highWatermark,
    snapshots: snapshots.map((s) => ({
      date: s.snapshot_date,
      equityBalance: s.equity_balance,
      cashBalance: s.cash_balance,
      marginUsed: s.margin_used,
      availableMargin: s.available_margin,
      unrealizedPnL: s.unrealized_pnl,
      highWatermark: s.high_watermark
    })),
    timestamp: new Date().toISOString()
  };
}