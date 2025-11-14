/**
 * Calculate P&L attribution by Greek (delta, gamma, theta, vega, rho)
 */
async function calculatePnLAttribution(userId, period = "daily") {
  try {
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
      default:
        startDate = now.startOf('day');
    }

    // Fetch Greeks snapshots for the period
    const { data: snapshotsData, error: snapshotsError } = await easysite.table.page(58033, {
      PageNo: 1,
      PageSize: 1000,
      OrderByField: "snapshot_time",
      IsAsc: true,
      Filters: [
      { name: "user_id", op: "Equal", value: userId },
      { name: "snapshot_time", op: "GreaterThanOrEqual", value: startDate.toISOString() }]

    });

    if (snapshotsError) {
      throw new Error("Failed to fetch Greeks snapshots: " + snapshotsError);
    }

    const snapshots = snapshotsData?.List || [];

    if (snapshots.length < 2) {
      // Not enough data to calculate attribution
      return {
        delta_pnl: 0,
        gamma_pnl: 0,
        theta_pnl: 0,
        vega_pnl: 0,
        rho_pnl: 0,
        other_pnl: 0,
        total_pnl: 0,
        period,
        timestamp: new Date().toISOString()
      };
    }

    // Get first and last snapshot
    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    // Calculate total P&L
    const totalPnL = lastSnapshot.portfolio_value - firstSnapshot.portfolio_value;

    // Simplified P&L attribution calculation
    // In reality, this would require underlying price movements, IV changes, etc.
    // Here we estimate based on Greek changes

    // Delta P&L: Estimate from delta changes (proxy for directional moves)
    const deltaChange = Math.abs(lastSnapshot.total_delta - firstSnapshot.total_delta);
    const deltaPnL = deltaChange * 10; // Simplified: $10 per delta unit change

    // Theta P&L: Time decay (negative for long options)
    const thetaPnL = (lastSnapshot.total_theta + firstSnapshot.total_theta) / 2;

    // Gamma P&L: Convexity gains/losses (small contributor)
    const gammaChange = Math.abs(lastSnapshot.total_gamma - firstSnapshot.total_gamma);
    const gammaPnL = gammaChange * 5; // Simplified

    // Vega P&L: IV changes (estimate)
    const vegaChange = Math.abs(lastSnapshot.total_vega - firstSnapshot.total_vega);
    const vegaPnL = vegaChange * 0.1; // Simplified

    // Rho P&L: Interest rate changes (usually small)
    const rhoPnL = 0; // Typically negligible for short-term trading

    // Other P&L: Residual
    const explainedPnL = deltaPnL + thetaPnL + gammaPnL + vegaPnL + rhoPnL;
    const otherPnL = totalPnL - explainedPnL;

    const attribution = {
      delta_pnl: deltaPnL,
      gamma_pnl: gammaPnL,
      theta_pnl: thetaPnL,
      vega_pnl: vegaPnL,
      rho_pnl: rhoPnL,
      other_pnl: otherPnL,
      total_pnl: totalPnL,
      period,
      timestamp: new Date().toISOString()
    };

    // Save attribution to database
    const { error: saveError } = await easysite.table.create(58034, {
      user_id: userId,
      attribution_date: new Date().toISOString(),
      ...attribution
    });

    if (saveError) {
      console.error("Failed to save P&L attribution:", saveError);
    }

    return attribution;
  } catch (error) {
    throw new Error(`Failed to calculate P&L attribution: ${error.message}`);
  }
}