/**
 * Save portfolio Greeks snapshot to database
 */
async function saveGreeksSnapshot(userId) {
  try {
    // Calculate current Greeks
    const greeksData = await easysite.apis.run({
      path: "__easysite_nodejs__/optionsGreeksCalculator.js",
      param: [userId]
    });

    if (greeksData.error) {
      throw new Error("Failed to calculate Greeks: " + greeksData.error);
    }

    const { portfolioGreeks, portfolioValue } = greeksData.data;

    // Save snapshot
    const snapshotData = {
      user_id: userId,
      snapshot_time: new Date().toISOString(),
      total_delta: portfolioGreeks.delta,
      total_gamma: portfolioGreeks.gamma,
      total_theta: portfolioGreeks.theta,
      total_vega: portfolioGreeks.vega,
      total_rho: portfolioGreeks.rho,
      portfolio_value: portfolioValue
    };

    const { error } = await easysite.table.create(58033, snapshotData);

    if (error) {
      throw new Error("Failed to save Greeks snapshot: " + error);
    }

    return {
      success: true,
      snapshot: snapshotData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to save Greeks snapshot: ${error.message}`);
  }
}