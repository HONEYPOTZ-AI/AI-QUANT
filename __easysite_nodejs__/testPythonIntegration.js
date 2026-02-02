/**
 * Test Python Integration
 * Comprehensive testing utility for Python service integration
 */

import {
  testPythonServiceConnection,
  fetchPythonMarketData,
  analyzePythonIronCondor,
  calculatePythonIronCondorGreeks,
  optimizePythonIronCondor
} from './pythonServiceBridge.js';

/**
 * Run comprehensive integration tests
 */
export async function runIntegrationTests() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  // Test 1: Connection
  try {
    const connectionResult = await testPythonServiceConnection();
    results.tests.push({
      name: 'Connection Test',
      status: 'passed',
      details: connectionResult
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Connection Test',
      status: 'failed',
      error: error.message
    });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 2: Market Data
  try {
    const marketData = await fetchPythonMarketData(['SPX', 'AAPL']);
    results.tests.push({
      name: 'Market Data Fetch',
      status: 'passed',
      details: {
        symbolsCount: Object.keys(marketData.data || {}).length,
        timestamp: marketData.timestamp
      }
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Market Data Fetch',
      status: 'failed',
      error: error.message
    });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 3: Iron Condor Analysis
  try {
    const analysis = await analyzePythonIronCondor({
      symbol: 'SPX',
      expiration_date: '2024-12-20',
      long_call_strike: 5800,
      short_call_strike: 5750,
      short_put_strike: 5650,
      long_put_strike: 5600,
      contracts: 1,
      current_price: 5700,
      implied_volatility: 0.15
    });

    results.tests.push({
      name: 'Iron Condor Analysis',
      status: 'passed',
      details: {
        maxProfit: analysis.risk_reward?.max_profit,
        maxLoss: analysis.risk_reward?.max_loss,
        probabilityOfProfit: analysis.probability?.profit_percent,
        hasPayoffProfile: !!analysis.payoff_profile
      }
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Iron Condor Analysis',
      status: 'failed',
      error: error.message
    });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 4: Greeks Calculation
  try {
    const greeks = await calculatePythonIronCondorGreeks({
      long_call_greeks: { delta: 0.15, gamma: 0.001, theta: -0.5, vega: 0.8 },
      short_call_greeks: { delta: 0.30, gamma: 0.002, theta: -1.0, vega: 1.5 },
      short_put_greeks: { delta: -0.30, gamma: 0.002, theta: -1.0, vega: 1.5 },
      long_put_greeks: { delta: -0.15, gamma: 0.001, theta: -0.5, vega: 0.8 },
      contracts: 1
    });

    results.tests.push({
      name: 'Greeks Calculation',
      status: 'passed',
      details: {
        portfolioDelta: greeks.portfolio_greeks?.delta,
        portfolioTheta: greeks.portfolio_greeks?.theta,
        hasRiskProfile: !!greeks.risk_profile
      }
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Greeks Calculation',
      status: 'failed',
      error: error.message
    });
    results.summary.failed++;
  }
  results.summary.total++;

  // Test 5: Optimization
  try {
    const optimization = await optimizePythonIronCondor({
      symbol: 'SPX',
      expiration_date: '2024-12-20',
      current_price: 5700,
      implied_volatility: 0.15,
      target_probability: 0.70,
      wing_width: 5.0,
      contracts: 1
    });

    results.tests.push({
      name: 'Strike Optimization',
      status: 'passed',
      details: {
        optimalStrikes: optimization.optimal_strikes,
        hasExpectedPerformance: !!optimization.expected_performance
      }
    });
    results.summary.passed++;
  } catch (error) {
    results.tests.push({
      name: 'Strike Optimization',
      status: 'failed',
      error: error.message
    });
    results.summary.failed++;
  }
  results.summary.total++;

  // Calculate success rate
  results.summary.successRate = 
    ((results.summary.passed / results.summary.total) * 100).toFixed(2);

  return results;
}

/**
 * Test specific endpoint
 */
export async function testEndpoint(endpointName, params = {}) {
  const tests = {
    connection: () => testPythonServiceConnection(),
    marketData: () => fetchPythonMarketData(params.symbols || ['SPX']),
    analysis: () => analyzePythonIronCondor(params),
    greeks: () => calculatePythonIronCondorGreeks(params),
    optimization: () => optimizePythonIronCondor(params)
  };

  const testFn = tests[endpointName];
  if (!testFn) {
    throw new Error(`Unknown endpoint: ${endpointName}`);
  }

  try {
    const result = await testFn();
    return {
      status: 'success',
      data: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
