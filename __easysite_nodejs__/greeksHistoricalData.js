/**
 * Fetch historical Greeks snapshots
 */
async function getGreeksHistoricalData(userId, days = 30) {
  try {
    const startDate = dayjs().subtract(days, 'day').toISOString();

    const { data, error } = await easysite.table.page(58033, {
      PageNo: 1,
      PageSize: days * 24, // Hourly snapshots
      OrderByField: "snapshot_time",
      IsAsc: true,
      Filters: [
        { name: "user_id", op: "Equal", value: userId },
        { name: "snapshot_time", op: "GreaterThanOrEqual", value: startDate }
      ]
    });

    if (error) {
      throw new Error("Failed to fetch historical Greeks data: " + error);
    }

    const snapshots = data?.List || [];

    return {
      userId,
      days,
      snapshots: snapshots.map(s => ({
        snapshot_time: s.snapshot_time,
        total_delta: s.total_delta,
        total_gamma: s.total_gamma,
        total_theta: s.total_theta,
        total_vega: s.total_vega,
        total_rho: s.total_rho,
        portfolio_value: s.portfolio_value
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch historical Greeks: ${error.message}`);
  }
}