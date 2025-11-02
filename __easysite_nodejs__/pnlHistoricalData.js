
async function getPnLHistoricalData(broker = "ALL", days = 30) {
const startDate = dayjs().subtract(days, 'day').toISOString();

  const filters = [
    { name: "snapshot_date", op: "GreaterThanOrEqual", value: startDate }
  ];

  if (broker !== "ALL") {
    filters.push({ name: "broker", op: "Equal", value: broker });
  }

  const { data, error } = await easysite.table.page(56079, {
    PageNo: 1,
    PageSize: days,
    OrderByField: "snapshot_date",
    IsAsc: true,
    Filters: filters
  });

  if (error) {
    throw new Error("Failed to fetch historical P&L data: " + error);
  }

  const snapshots = data?.List || [];
  
  return {
    broker: broker,
    days: days,
    snapshots: snapshots.map(s => ({
      date: s.snapshot_date,
      dailyPnL: s.daily_pnl,
      weeklyPnL: s.weekly_pnl,
      monthlyPnL: s.monthly_pnl,
      totalPnL: s.total_pnl,
      grossPnL: s.gross_pnl,
      netPnL: s.net_pnl,
      winRate: s.win_rate,
      totalTrades: s.total_trades
    })),
    timestamp: new Date().toISOString()
  };
}
