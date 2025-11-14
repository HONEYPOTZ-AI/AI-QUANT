/**
 * Fetch historical P&L attribution data
 */
async function getPnLAttributionHistory(userId, days = 30) {
  try {
    const startDate = dayjs().subtract(days, 'day').toISOString();

    const { data, error } = await easysite.table.page(58034, {
      PageNo: 1,
      PageSize: days,
      OrderByField: "attribution_date",
      IsAsc: true,
      Filters: [
      { name: "user_id", op: "Equal", value: userId },
      { name: "attribution_date", op: "GreaterThanOrEqual", value: startDate }]

    });

    if (error) {
      throw new Error("Failed to fetch P&L attribution history: " + error);
    }

    const attributions = data?.List || [];

    return {
      userId,
      days,
      attributions: attributions.map((a) => ({
        date: a.attribution_date,
        delta_pnl: a.delta_pnl,
        gamma_pnl: a.gamma_pnl,
        theta_pnl: a.theta_pnl,
        vega_pnl: a.vega_pnl,
        rho_pnl: a.rho_pnl,
        other_pnl: a.other_pnl,
        total_pnl: a.total_pnl
      })),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch P&L attribution history: ${error.message}`);
  }
}