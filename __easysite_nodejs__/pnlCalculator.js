
async function calculatePnL(broker = "ALL", period = "daily") {
  const now = dayjs();

  // Calculate date ranges
  let startDate;
  switch (period) {
    case "daily":
      startDate = now.startOf('day');
      break;
    case "weekly":
      startDate = now.startOf('week');
      break;
    case "monthly":
      startDate = now.startOf('month');
      break;
    case "total":
      startDate = dayjs('2020-01-01'); // Far enough in the past
      break;
    default:
      startDate = now.startOf('day');
  }

  // Build filters
  const filters = [];
  if (broker !== "ALL") {
    filters.push({ name: "broker", op: "Equal", value: broker });
  }

  // Fetch all positions (both open and closed)
  const { data: positionsData, error: positionsError } = await easysite.table.page(56078, {
    PageNo: 1,
    PageSize: 1000,
    OrderByField: "open_time",
    IsAsc: false,
    Filters: filters
  });

  if (positionsError) {
    throw new Error("Failed to fetch positions: " + positionsError);
  }

  const positions = positionsData?.List || [];

  // Filter positions by date range
  const relevantPositions = positions.filter((pos) => {
    const openTime = dayjs(pos.open_time);
    return openTime.isAfter(startDate);
  });

  // Calculate metrics
  let grossPnL = 0;
  let totalCommission = 0;
  let totalTrades = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let largestWin = 0;
  let largestLoss = 0;
  const symbolPnL = {};

  for (const pos of relevantPositions) {
    const pnl = pos.status === "CLOSED" ? pos.realized_pnl : pos.unrealized_pnl;
    const commission = pos.commission || 0;

    grossPnL += pnl;
    totalCommission += commission;

    if (pos.status === "CLOSED") {
      totalTrades++;

      if (pnl > 0) {
        winningTrades++;
        totalWins += pnl;
        largestWin = Math.max(largestWin, pnl);
      } else if (pnl < 0) {
        losingTrades++;
        totalLosses += Math.abs(pnl);
        largestLoss = Math.min(largestLoss, pnl);
      }
    }

    // Symbol breakdown
    if (!symbolPnL[pos.symbol]) {
      symbolPnL[pos.symbol] = {
        symbol: pos.symbol,
        totalPnL: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }
    symbolPnL[pos.symbol].totalPnL += pnl;
    if (pos.status === "CLOSED") {
      symbolPnL[pos.symbol].trades++;
      if (pnl > 0) symbolPnL[pos.symbol].wins++;
      if (pnl < 0) symbolPnL[pos.symbol].losses++;
    }
  }

  const netPnL = grossPnL - totalCommission;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades * 100 : 0;
  const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;

  return {
    period: period,
    broker: broker,
    grossPnL: grossPnL,
    netPnL: netPnL,
    totalCommission: totalCommission,
    totalTrades: totalTrades,
    winningTrades: winningTrades,
    losingTrades: losingTrades,
    winRate: winRate,
    avgWin: avgWin,
    avgLoss: avgLoss,
    largestWin: largestWin,
    largestLoss: largestLoss,
    symbolBreakdown: Object.values(symbolPnL),
    timestamp: new Date().toISOString()
  };
}