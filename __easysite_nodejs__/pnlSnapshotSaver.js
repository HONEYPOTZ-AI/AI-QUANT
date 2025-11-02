
async function savePnLSnapshot(broker = "ALL") {
// Calculate P&L for all periods
  const dailyPnL = await easysite.run({
    path: "__easysite_nodejs__/pnlCalculator.js",
    param: [broker, "daily"]
  });

  const weeklyPnL = await easysite.run({
    path: "__easysite_nodejs__/pnlCalculator.js",
    param: [broker, "weekly"]
  });

  const monthlyPnL = await easysite.run({
    path: "__easysite_nodejs__/pnlCalculator.js",
    param: [broker, "monthly"]
  });

  const totalPnL = await easysite.run({
    path: "__easysite_nodejs__/pnlCalculator.js",
    param: [broker, "total"]
  });

  if (dailyPnL.error || weeklyPnL.error || monthlyPnL.error || totalPnL.error) {
    throw new Error("Failed to calculate P&L metrics");
  }

  const daily = dailyPnL.data;
  const weekly = weeklyPnL.data;
  const monthly = monthlyPnL.data;
  const total = totalPnL.data;

  // Save snapshot
  const snapshotData = {
    snapshot_date: new Date().toISOString(),
    broker: broker,
    daily_pnl: daily.netPnL,
    weekly_pnl: weekly.netPnL,
    monthly_pnl: monthly.netPnL,
    total_pnl: total.netPnL,
    gross_pnl: total.grossPnL,
    net_pnl: total.netPnL,
    total_trades: total.totalTrades,
    winning_trades: total.winningTrades,
    losing_trades: total.losingTrades,
    win_rate: total.winRate,
    avg_win: total.avgWin,
    avg_loss: total.avgLoss,
    largest_win: total.largestWin,
    largest_loss: total.largestLoss
  };

  const { error } = await easysite.table.create(56079, snapshotData);
  
  if (error) {
    throw new Error("Failed to save P&L snapshot: " + error);
  }

  return {
    success: true,
    snapshot: snapshotData,
    timestamp: new Date().toISOString()
  };
}
