/**
 * Iron Condor Strategy Backend
 * Manages creation, monitoring, and analysis of iron condor positions
 */

import _dayjs from 'npm:dayjs@1.11.13';
import axios from 'npm:axios';
import { fetchOptionQuote } from './spxOptionsChainFetcher.js';

/**
 * Create new iron condor strategy
 * @param {number} userId - User ID
 * @param {Object} strategyConfig - Strategy configuration
 * @returns {Object} Created strategy details
 */
export async function createIronCondor(userId, strategyConfig) {
  try {
    // Validate configuration
    validateIronCondorConfig(strategyConfig);

    const {
      symbol,
      expirationDate,
      longCallStrike,
      shortCallStrike,
      shortPutStrike,
      longPutStrike,
      contracts,
      accountId
    } = strategyConfig;

    // Fetch current underlying price
    const underlyingPrice = await fetchUnderlyingPrice(symbol);
    
    // Fetch option quotes for all four legs
    const [longCall, shortCall, shortPut, longPut] = await Promise.all([
      fetchOptionQuote(buildOptionTicker(symbol, expirationDate, 'C', longCallStrike)),
      fetchOptionQuote(buildOptionTicker(symbol, expirationDate, 'C', shortCallStrike)),
      fetchOptionQuote(buildOptionTicker(symbol, expirationDate, 'P', shortPutStrike)),
      fetchOptionQuote(buildOptionTicker(symbol, expirationDate, 'P', longPutStrike))
    ]);

    // Calculate net credit/debit (iron condor should be net credit)
    const callSpreadCredit = (shortCall.bid || shortCall.last || 0) - (longCall.ask || longCall.last || 0);
    const putSpreadCredit = (shortPut.bid || shortPut.last || 0) - (longPut.ask || longPut.last || 0);
    const netCredit = (callSpreadCredit + putSpreadCredit) * contracts * 100;

    // Calculate max profit and max loss
    const callSpreadWidth = longCallStrike - shortCallStrike;
    const putSpreadWidth = shortPutStrike - longPutStrike;
    const maxProfit = netCredit;
    const maxLoss = (Math.max(callSpreadWidth, putSpreadWidth) * contracts * 100) - netCredit;

    // Calculate breakeven points
    const upperBreakeven = shortCallStrike + (netCredit / (contracts * 100));
    const lowerBreakeven = shortPutStrike - (netCredit / (contracts * 100));

    // Calculate initial Greeks
    const initialGreeks = calculateIronCondorGreeks(longCall, shortCall, shortPut, longPut, contracts);

    // Calculate probability of profit (simplified)
    const pop = calculateProbabilityOfProfit(underlyingPrice, lowerBreakeven, upperBreakeven);

    // Create strategy record
    const strategyData = {
      user_id: userId,
      account_id: accountId || 'DEFAULT',
      symbol: symbol,
      expiration_date: expirationDate,
      contracts: contracts,
      long_call_strike: longCallStrike,
      short_call_strike: shortCallStrike,
      short_put_strike: shortPutStrike,
      long_put_strike: longPutStrike,
      entry_price: underlyingPrice,
      net_credit: parseFloat(netCredit.toFixed(2)),
      max_profit: parseFloat(maxProfit.toFixed(2)),
      max_loss: parseFloat(maxLoss.toFixed(2)),
      upper_breakeven: parseFloat(upperBreakeven.toFixed(2)),
      lower_breakeven: parseFloat(lowerBreakeven.toFixed(2)),
      probability_of_profit: parseFloat(pop.toFixed(2)),
      current_pnl: 0,
      current_delta: parseFloat(initialGreeks.delta.toFixed(4)),
      current_gamma: parseFloat(initialGreeks.gamma.toFixed(4)),
      current_theta: parseFloat(initialGreeks.theta.toFixed(4)),
      current_vega: parseFloat(initialGreeks.vega.toFixed(4)),
      status: 'OPEN',
      entry_date: new Date().toISOString(),
      exit_date: null,
      notes: strategyConfig.notes || ''
    };

    // Insert into database
    const { error: createError } = await easysite.table.create(74342, strategyData);
    
    if (createError) {
      throw new Error(`Failed to create iron condor: ${createError}`);
    }

    // Fetch the created strategy to get the ID
    const { data: strategies, error: fetchError } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 1,
      OrderByField: 'id',
      IsAsc: false,
      Filters: [{ name: 'user_id', op: 'Equal', value: userId }]
    });

    if (fetchError || !strategies?.List?.length) {
      throw new Error('Failed to retrieve created strategy');
    }

    const createdStrategy = strategies.List[0];

    // Create initial performance snapshot
    await savePerformanceSnapshot(createdStrategy.id, {
      underlyingPrice,
      pnl: 0,
      greeks: initialGreeks
    });

    return {
      strategyId: createdStrategy.id,
      ...strategyData,
      message: 'Iron condor strategy created successfully'
    };
  } catch (error) {
    console.error('Error creating iron condor:', error);
    throw new Error(`Failed to create iron condor: ${error.message}`);
  }
}

/**
 * Get active iron condor strategies for user
 * @param {number} userId - User ID
 * @returns {Array} Active strategies
 */
export async function getActiveStrategies(userId) {
  try {
    const { data: strategiesData, error } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 100,
      OrderByField: 'entry_date',
      IsAsc: false,
      Filters: [
        { name: 'user_id', op: 'Equal', value: userId },
        { name: 'status', op: 'Equal', value: 'OPEN' }
      ]
    });

    if (error) {
      throw new Error(`Failed to fetch strategies: ${error}`);
    }

    return strategiesData?.List || [];
  } catch (error) {
    console.error('Error fetching active strategies:', error);
    throw new Error(`Failed to fetch active strategies: ${error.message}`);
  }
}

/**
 * Update strategy performance with current market data
 * @param {number} strategyId - Strategy ID
 * @returns {Object} Updated performance metrics
 */
export async function updateStrategyPerformance(strategyId) {
  try {
    // Fetch strategy details
    const { data: strategyData, error: strategyError } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'id', op: 'Equal', value: strategyId }]
    });

    if (strategyError || !strategyData?.List?.length) {
      throw new Error('Strategy not found');
    }

    const strategy = strategyData.List[0];

    // Fetch current underlying price
    const underlyingPrice = await fetchUnderlyingPrice(strategy.symbol);

    // Fetch current option quotes
    const [longCall, shortCall, shortPut, longPut] = await Promise.all([
      fetchOptionQuote(buildOptionTicker(strategy.symbol, strategy.expiration_date, 'C', strategy.long_call_strike)),
      fetchOptionQuote(buildOptionTicker(strategy.symbol, strategy.expiration_date, 'C', strategy.short_call_strike)),
      fetchOptionQuote(buildOptionTicker(strategy.symbol, strategy.expiration_date, 'P', strategy.short_put_strike)),
      fetchOptionQuote(buildOptionTicker(strategy.symbol, strategy.expiration_date, 'P', strategy.long_put_strike))
    ]);

    // Calculate current value of the position
    const currentCallSpreadValue = ((longCall.ask || longCall.last || 0) - (shortCall.bid || shortCall.last || 0)) * strategy.contracts * 100;
    const currentPutSpreadValue = ((longPut.ask || longPut.last || 0) - (shortPut.bid || shortPut.last || 0)) * strategy.contracts * 100;
    const currentPositionValue = currentCallSpreadValue + currentPutSpreadValue;
    
    // Calculate P&L (for credit spreads, we want the value to decrease)
    const currentPnL = strategy.net_credit + currentPositionValue;

    // Calculate current Greeks
    const currentGreeks = calculateIronCondorGreeks(longCall, shortCall, shortPut, longPut, strategy.contracts);

    // Update strategy with current metrics
    const { error: updateError } = await easysite.table.update(74342, {
      id: strategyId,
      current_pnl: parseFloat(currentPnL.toFixed(2)),
      current_delta: parseFloat(currentGreeks.delta.toFixed(4)),
      current_gamma: parseFloat(currentGreeks.gamma.toFixed(4)),
      current_theta: parseFloat(currentGreeks.theta.toFixed(4)),
      current_vega: parseFloat(currentGreeks.vega.toFixed(4))
    });

    if (updateError) {
      console.error('Failed to update strategy:', updateError);
    }

    // Save performance snapshot
    await savePerformanceSnapshot(strategyId, {
      underlyingPrice,
      pnl: currentPnL,
      greeks: currentGreeks
    });

    // Check for alerts
    await checkAlerts(strategyId);

    return {
      strategyId,
      underlyingPrice,
      currentPnL,
      currentGreeks,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating strategy performance:', error);
    throw new Error(`Failed to update performance: ${error.message}`);
  }
}

/**
 * Close iron condor strategy
 * @param {number} strategyId - Strategy ID
 * @param {Object} closeDetails - Optional closing details
 * @returns {Object} Closed strategy details
 */
export async function closeStrategy(strategyId, closeDetails = {}) {
  try {
    // Fetch strategy
    const { data: strategyData, error: strategyError } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'id', op: 'Equal', value: strategyId }]
    });

    if (strategyError || !strategyData?.List?.length) {
      throw new Error('Strategy not found');
    }

    const strategy = strategyData.List[0];

    // Update to most current P&L before closing
    const performance = await updateStrategyPerformance(strategyId);

    // Update strategy status
    const { error: updateError } = await easysite.table.update(74342, {
      id: strategyId,
      status: 'CLOSED',
      exit_date: new Date().toISOString(),
      notes: closeDetails.notes ? `${strategy.notes}\nClose: ${closeDetails.notes}` : strategy.notes
    });

    if (updateError) {
      throw new Error(`Failed to close strategy: ${updateError}`);
    }

    return {
      strategyId,
      finalPnL: performance.currentPnL,
      exitDate: new Date().toISOString(),
      message: 'Strategy closed successfully'
    };
  } catch (error) {
    console.error('Error closing strategy:', error);
    throw new Error(`Failed to close strategy: ${error.message}`);
  }
}

/**
 * Check alerts for strategy
 * @param {number} strategyId - Strategy ID
 * @returns {Array} Triggered alerts
 */
export async function checkAlerts(strategyId) {
  try {
    // Fetch strategy
    const { data: strategyData, error: strategyError } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'id', op: 'Equal', value: strategyId }]
    });

    if (strategyError || !strategyData?.List?.length) {
      throw new Error('Strategy not found');
    }

    const strategy = strategyData.List[0];
    const triggeredAlerts = [];

    // Alert thresholds
    const profitTarget = strategy.max_profit * 0.5; // 50% of max profit
    const lossThreshold = strategy.max_loss * 0.5;  // 50% of max loss
    const deltaThreshold = 0.15; // Absolute delta
    const daysToExpiration = _dayjs(strategy.expiration_date).diff(_dayjs(), 'days');

    // Check profit target
    if (strategy.current_pnl >= profitTarget) {
      triggeredAlerts.push({
        strategy_id: strategyId,
        alert_type: 'PROFIT_TARGET',
        message: `Profit target reached: $${strategy.current_pnl.toFixed(2)} (${((strategy.current_pnl / strategy.max_profit) * 100).toFixed(1)}% of max profit)`,
        severity: 'INFO',
        triggered_at: new Date().toISOString()
      });
    }

    // Check loss threshold
    if (strategy.current_pnl <= -lossThreshold) {
      triggeredAlerts.push({
        strategy_id: strategyId,
        alert_type: 'LOSS_THRESHOLD',
        message: `Loss threshold exceeded: -$${Math.abs(strategy.current_pnl).toFixed(2)} (${((Math.abs(strategy.current_pnl) / strategy.max_loss) * 100).toFixed(1)}% of max loss)`,
        severity: 'WARNING',
        triggered_at: new Date().toISOString()
      });
    }

    // Check delta breach
    if (Math.abs(strategy.current_delta) > deltaThreshold) {
      triggeredAlerts.push({
        strategy_id: strategyId,
        alert_type: 'DELTA_BREACH',
        message: `Delta threshold breached: ${strategy.current_delta.toFixed(4)} (threshold: ±${deltaThreshold})`,
        severity: 'WARNING',
        triggered_at: new Date().toISOString()
      });
    }

    // Check expiration warning
    if (daysToExpiration <= 7 && daysToExpiration > 0) {
      triggeredAlerts.push({
        strategy_id: strategyId,
        alert_type: 'EXPIRATION_WARNING',
        message: `Approaching expiration: ${daysToExpiration} days remaining`,
        severity: 'INFO',
        triggered_at: new Date().toISOString()
      });
    }

    // Save alerts to database
    for (const alert of triggeredAlerts) {
      // Check if similar alert exists in last hour
      const oneHourAgo = _dayjs().subtract(1, 'hour').toISOString();
      const { data: existingAlerts } = await easysite.table.page(74343, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: 'strategy_id', op: 'Equal', value: strategyId },
          { name: 'alert_type', op: 'Equal', value: alert.alert_type },
          { name: 'triggered_at', op: 'GreaterThanOrEqual', value: oneHourAgo }
        ]
      });

      // Only save if no recent duplicate
      if (!existingAlerts?.List?.length) {
        await easysite.table.create(74343, alert);
      }
    }

    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking alerts:', error);
    throw new Error(`Failed to check alerts: ${error.message}`);
  }
}

/**
 * Get strategy performance history
 * @param {number} strategyId - Strategy ID
 * @param {number} days - Number of days of history
 * @returns {Array} Performance snapshots
 */
export async function getStrategyPerformanceHistory(strategyId, days = 7) {
  try {
    const startDate = _dayjs().subtract(days, 'days').toISOString();

    const { data: performanceData, error } = await easysite.table.page(74344, {
      PageNo: 1,
      PageSize: 1000,
      OrderByField: 'snapshot_time',
      IsAsc: true,
      Filters: [
        { name: 'strategy_id', op: 'Equal', value: strategyId },
        { name: 'snapshot_time', op: 'GreaterThanOrEqual', value: startDate }
      ]
    });

    if (error) {
      throw new Error(`Failed to fetch performance history: ${error}`);
    }

    return performanceData?.List || [];
  } catch (error) {
    console.error('Error fetching performance history:', error);
    throw new Error(`Failed to fetch performance history: ${error.message}`);
  }
}

/**
 * Get strategy alerts
 * @param {number} strategyId - Strategy ID
 * @param {number} limit - Maximum number of alerts
 * @returns {Array} Alerts
 */
export async function getStrategyAlerts(strategyId, limit = 50) {
  try {
    const { data: alertsData, error } = await easysite.table.page(74343, {
      PageNo: 1,
      PageSize: limit,
      OrderByField: 'triggered_at',
      IsAsc: false,
      Filters: [{ name: 'strategy_id', op: 'Equal', value: strategyId }]
    });

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error}`);
    }

    return alertsData?.List || [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw new Error(`Failed to fetch alerts: ${error.message}`);
  }
}

// ==================== Helper Functions ====================

/**
 * Validate iron condor configuration
 */
function validateIronCondorConfig(config) {
  const required = ['symbol', 'expirationDate', 'longCallStrike', 'shortCallStrike', 
                    'shortPutStrike', 'longPutStrike', 'contracts'];
  
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate strike order
  if (config.longPutStrike >= config.shortPutStrike) {
    throw new Error('Long put strike must be below short put strike');
  }
  if (config.shortPutStrike >= config.shortCallStrike) {
    throw new Error('Short put strike must be below short call strike');
  }
  if (config.shortCallStrike >= config.longCallStrike) {
    throw new Error('Short call strike must be below long call strike');
  }

  // Validate contracts
  if (config.contracts <= 0 || !Number.isInteger(config.contracts)) {
    throw new Error('Contracts must be a positive integer');
  }
}

/**
 * Build option ticker symbol
 */
function buildOptionTicker(underlying, expiration, type, strike) {
  // Format: O:SPX241220C04500000
  const exp = expiration.replace(/-/g, '').substring(2); // YYMMDD
  const strikeStr = String(Math.round(strike * 1000)).padStart(8, '0');
  return `O:${underlying}${exp}${type}${strikeStr}`;
}

/**
 * Fetch underlying price
 */
async function fetchUnderlyingPrice(symbol) {
  try {
    const apiKey = Deno.env.get('POLYGON_API_KEY');
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not configured');
    }

    const response = await axios.get(
      `https://api.polygon.io/v2/aggs/ticker/I:${symbol}/prev`,
      {
        params: { apiKey, adjusted: true },
        timeout: 5000
      }
    );

    if (response.data?.results?.[0]) {
      return response.data.results[0].c;
    }

    throw new Error('Unable to fetch underlying price');
  } catch (error) {
    console.error('Error fetching underlying price:', error);
    throw new Error(`Failed to fetch underlying price: ${error.message}`);
  }
}

/**
 * Calculate iron condor Greeks
 */
function calculateIronCondorGreeks(longCall, shortCall, shortPut, longPut, contracts) {
  // Greeks for iron condor: sum of all legs (considering position direction)
  const delta = (
    -(longCall.delta || 0) +  // Long call (negative for debit)
    (shortCall.delta || 0) +   // Short call (positive for credit)
    (shortPut.delta || 0) +    // Short put (positive for credit)
    -(longPut.delta || 0)      // Long put (negative for debit)
  ) * contracts * 100;

  const gamma = (
    -(longCall.gamma || 0) +
    (shortCall.gamma || 0) +
    (shortPut.gamma || 0) +
    -(longPut.gamma || 0)
  ) * contracts * 100;

  const theta = (
    -(longCall.theta || 0) +
    (shortCall.theta || 0) +
    (shortPut.theta || 0) +
    -(longPut.theta || 0)
  ) * contracts * 100;

  const vega = (
    -(longCall.vega || 0) +
    (shortCall.vega || 0) +
    (shortPut.vega || 0) +
    -(longPut.vega || 0)
  ) * contracts * 100;

  return { delta, gamma, theta, vega };
}

/**
 * Calculate probability of profit (simplified)
 */
function calculateProbabilityOfProfit(currentPrice, lowerBreakeven, upperBreakeven) {
  // Simplified calculation: assume normal distribution
  // In production, use actual implied volatility and proper probability calculations
  const range = upperBreakeven - lowerBreakeven;
  const centerDistance = Math.abs(currentPrice - ((upperBreakeven + lowerBreakeven) / 2));
  const normalizedDistance = centerDistance / (range / 2);
  
  // Rough estimate: further from center = higher PoP
  return Math.min(95, Math.max(30, 70 + (normalizedDistance * 10)));
}

/**
 * Save performance snapshot
 */
async function savePerformanceSnapshot(strategyId, performance) {
  try {
    const snapshot = {
      strategy_id: strategyId,
      snapshot_time: new Date().toISOString(),
      underlying_price: performance.underlyingPrice,
      current_pnl: parseFloat(performance.pnl.toFixed(2)),
      delta: parseFloat(performance.greeks.delta.toFixed(4)),
      gamma: parseFloat(performance.greeks.gamma.toFixed(4)),
      theta: parseFloat(performance.greeks.theta.toFixed(4)),
      vega: parseFloat(performance.greeks.vega.toFixed(4))
    };

    const { error } = await easysite.table.create(74344, snapshot);
    if (error) {
      console.error('Failed to save performance snapshot:', error);
    }
  } catch (error) {
    console.error('Error saving performance snapshot:', error);
  }
}
