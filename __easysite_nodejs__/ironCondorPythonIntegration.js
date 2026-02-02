/**
 * Iron Condor Python Integration
 * Integrates Python FastAPI analytics with database storage
 */

import {
  analyzePythonIronCondor,
  calculatePythonIronCondorGreeks,
  optimizePythonIronCondor,
  monitorPythonPosition
} from './pythonServiceBridge.js';

/**
 * Create iron condor with Python analytics
 */
export async function createIronCondorWithPython(userId, strategyConfig) {
  try {
    // Parse expiration date
    const expirationDate = strategyConfig.expirationDate;
    const expiration = new Date(expirationDate);
    const daysToExpiration = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const yearsToExpiration = daysToExpiration / 365.0;

    // Use Python service for advanced analytics
    const pythonAnalysis = await analyzePythonIronCondor({
      symbol: strategyConfig.symbol,
      expiration_date: expirationDate,
      long_call_strike: strategyConfig.longCallStrike,
      short_call_strike: strategyConfig.shortCallStrike,
      short_put_strike: strategyConfig.shortPutStrike,
      long_put_strike: strategyConfig.longPutStrike,
      contracts: strategyConfig.contracts,
      current_price: strategyConfig.currentPrice,
      implied_volatility: strategyConfig.impliedVolatility || 0.20,
      risk_free_rate: 0.05
    });

    // Save to database
    const strategyData = {
      user_id: userId,
      account_id: strategyConfig.accountId || 'DEFAULT',
      symbol: strategyConfig.symbol,
      expiration_date: expirationDate,
      contracts: strategyConfig.contracts,
      long_call_strike: strategyConfig.longCallStrike,
      short_call_strike: strategyConfig.shortCallStrike,
      short_put_strike: strategyConfig.shortPutStrike,
      long_put_strike: strategyConfig.longPutStrike,
      entry_price: pythonAnalysis.sensitivity?.current_price || 0,
      net_credit: pythonAnalysis.risk_reward?.net_credit || 0,
      max_profit: pythonAnalysis.risk_reward?.max_profit || 0,
      max_loss: pythonAnalysis.risk_reward?.max_loss || 0,
      upper_breakeven: pythonAnalysis.breakevens?.upper || 0,
      lower_breakeven: pythonAnalysis.breakevens?.lower || 0,
      probability_of_profit: pythonAnalysis.probability?.profit_percent || 0,
      current_pnl: 0,
      current_delta: 0,
      current_gamma: 0,
      current_theta: 0,
      current_vega: 0,
      status: 'OPEN',
      entry_date: new Date().toISOString(),
      exit_date: null,
      notes: strategyConfig.notes || ''
    };

    const { error: createError } = await easysite.table.create(74342, strategyData);
    
    if (createError) {
      throw new Error(`Failed to create iron condor: ${createError}`);
    }

    // Fetch the created strategy
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

    return {
      strategyId: createdStrategy.id,
      ...strategyData,
      pythonAnalysis,
      message: 'Iron condor strategy created with Python analytics'
    };
  } catch (error) {
    console.error('Error creating iron condor with Python:', error);
    throw new Error(`Failed to create iron condor: ${error.message}`);
  }
}

/**
 * Update strategy with Python analytics
 */
export async function updateStrategyWithPython(strategyId) {
  try {
    // Fetch strategy from database
    const { data: strategyData, error: strategyError } = await easysite.table.page(74342, {
      PageNo: 1,
      PageSize: 1,
      Filters: [{ name: 'id', op: 'Equal', value: strategyId }]
    });

    if (strategyError || !strategyData?.List?.length) {
      throw new Error('Strategy not found');
    }

    const strategy = strategyData.List[0];

    // Get Python analytics
    const pythonAnalysis = await analyzePythonIronCondor({
      symbol: strategy.symbol,
      expiration_date: strategy.expiration_date,
      long_call_strike: strategy.long_call_strike,
      short_call_strike: strategy.short_call_strike,
      short_put_strike: strategy.short_put_strike,
      long_put_strike: strategy.long_put_strike,
      contracts: strategy.contracts,
      implied_volatility: 0.20
    });

    // Update database with new analytics
    const { error: updateError } = await easysite.table.update(74342, {
      id: strategyId,
      probability_of_profit: pythonAnalysis.probability?.profit_percent || strategy.probability_of_profit
    });

    if (updateError) {
      console.error('Failed to update strategy:', updateError);
    }

    return {
      strategyId,
      pythonAnalysis,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating with Python:', error);
    throw new Error(`Failed to update strategy: ${error.message}`);
  }
}

/**
 * Get optimization recommendations from Python
 */
export async function getOptimizationRecommendations(symbol, expirationDate, currentPrice, impliedVolatility) {
  try {
    const optimization = await optimizePythonIronCondor({
      symbol,
      expiration_date: expirationDate,
      current_price: currentPrice,
      implied_volatility: impliedVolatility,
      target_probability: 0.70,
      wing_width: 5.0,
      contracts: 1
    });

    return optimization;
  } catch (error) {
    console.error('Error getting optimization:', error);
    throw new Error(`Failed to get optimization: ${error.message}`);
  }
}
