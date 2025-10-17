
// Advanced portfolio optimization and risk management
function optimizePortfolio(portfolioData, riskTolerance = 'moderate', constraints = {}) {
  const { holdings = [], targetReturn = 0.08, maxPositionSize = 0.3, rebalanceThreshold = 0.05 } = constraints;

  // Calculate current portfolio metrics
  const currentMetrics = calculatePortfolioMetrics(holdings);

  // Generate optimization recommendations
  const optimization = generateOptimizationRecommendations(
    holdings,
    riskTolerance,
    targetReturn,
    maxPositionSize
  );

  // Calculate risk metrics
  const riskAnalysis = performRiskAnalysis(holdings, riskTolerance);

  // Generate rebalancing suggestions
  const rebalancing = generateRebalancingPlan(holdings, optimization.targetWeights, rebalanceThreshold);

  // Stress testing
  const stressTesting = performStressTesting(holdings);

  return {
    currentMetrics,
    optimization,
    riskAnalysis,
    rebalancing,
    stressTesting,
    recommendations: generateActionableRecommendations(optimization, riskAnalysis, rebalancing),
    timestamp: new Date().toISOString()
  };
}

function calculatePortfolioMetrics(holdings) {
  if (!holdings || holdings.length === 0) {
    return {
      totalValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      diversificationScore: 0,
      volatility: 0,
      sharpeRatio: 0
    };
  }

  let totalValue = 0;
  let totalCost = 0;
  let weightedReturns = 0;
  let weightedVolatility = 0;

  // Calculate basic metrics
  holdings.forEach((holding) => {
    const currentValue = holding.quantity * holding.currentPrice;
    const costBasis = holding.quantity * holding.purchasePrice;
    const weight = currentValue / holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    const returnRate = (holding.currentPrice - holding.purchasePrice) / holding.purchasePrice;

    totalValue += currentValue;
    totalCost += costBasis;
    weightedReturns += weight * returnRate;
    weightedVolatility += weight * (holding.volatility || 0.2); // Default 20% volatility
  });

  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? totalReturn / totalCost * 100 : 0;

  // Calculate diversification score (simplified Herfindahl-Hirschman Index)
  const weights = holdings.map((h) => h.quantity * h.currentPrice / totalValue);
  const hhi = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  const diversificationScore = Math.max(0, (1 - hhi) * 100); // Convert to 0-100 scale

  // Calculate Sharpe ratio (simplified)
  const riskFreeRate = 0.02; // 2% risk-free rate
  const sharpeRatio = weightedVolatility > 0 ? (weightedReturns - riskFreeRate) / weightedVolatility : 0;

  return {
    totalValue: parseFloat(totalValue.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    diversificationScore: parseFloat(diversificationScore.toFixed(2)),
    volatility: parseFloat((weightedVolatility * 100).toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(3)),
    numberOfHoldings: holdings.length
  };
}

function generateOptimizationRecommendations(holdings, riskTolerance, targetReturn, maxPositionSize) {
  // Risk tolerance mappings
  const riskProfiles = {
    'conservative': { maxVolatility: 0.12, targetReturn: 0.06, equityAllocation: 0.4 },
    'moderate': { maxVolatility: 0.18, targetReturn: 0.08, equityAllocation: 0.6 },
    'aggressive': { maxVolatility: 0.25, targetReturn: 0.12, equityAllocation: 0.8 }
  };

  const profile = riskProfiles[riskTolerance] || riskProfiles['moderate'];

  // Calculate current weights
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const currentWeights = holdings.map((holding) => ({
    symbol: holding.symbol,
    currentWeight: holding.quantity * holding.currentPrice / totalValue,
    expectedReturn: holding.expectedReturn || 0.08,
    volatility: holding.volatility || 0.2,
    sector: holding.sector || 'Technology'
  }));

  // Generate target weights using simplified mean-variance optimization
  const targetWeights = optimizeWeights(currentWeights, profile, maxPositionSize);

  // Calculate expected portfolio return and risk
  const expectedReturn = targetWeights.reduce((sum, w) => sum + w.targetWeight * w.expectedReturn, 0);
  const expectedVolatility = Math.sqrt(
    targetWeights.reduce((sum, w) => sum + Math.pow(w.targetWeight * w.volatility, 2), 0)
  );

  return {
    targetWeights,
    expectedReturn: parseFloat((expectedReturn * 100).toFixed(2)),
    expectedVolatility: parseFloat((expectedVolatility * 100).toFixed(2)),
    expectedSharpeRatio: parseFloat(((expectedReturn - 0.02) / expectedVolatility).toFixed(3)),
    riskProfile: riskTolerance,
    optimizationScore: calculateOptimizationScore(targetWeights, profile)
  };
}

function optimizeWeights(holdings, profile, maxPositionSize) {
  // Simplified optimization: balance between return and risk
  const n = holdings.length;
  let targetWeights = holdings.map((h) => ({ ...h, targetWeight: 1 / n })); // Equal weight starting point

  // Adjust weights based on risk-return characteristics
  targetWeights.forEach((holding) => {
    // Higher weight for higher risk-adjusted returns
    const riskAdjustedReturn = holding.expectedReturn / holding.volatility;
    const scoreMultiplier = Math.max(0.5, Math.min(2.0, riskAdjustedReturn / 0.4)); // Normalize around 0.4

    holding.targetWeight *= scoreMultiplier;
  });

  // Normalize weights to sum to 1
  const totalWeight = targetWeights.reduce((sum, h) => sum + h.targetWeight, 0);
  targetWeights.forEach((h) => {
    h.targetWeight = Math.min(maxPositionSize, h.targetWeight / totalWeight);
  });

  // Final normalization
  const finalTotalWeight = targetWeights.reduce((sum, h) => sum + h.targetWeight, 0);
  targetWeights.forEach((h) => {
    h.targetWeight = parseFloat((h.targetWeight / finalTotalWeight).toFixed(4));
    h.recommendedAction = h.targetWeight > h.currentWeight ? 'BUY' :
    h.targetWeight < h.currentWeight ? 'SELL' : 'HOLD';
    h.weightChange = parseFloat((h.targetWeight - h.currentWeight).toFixed(4));
  });

  return targetWeights;
}

function performRiskAnalysis(holdings, riskTolerance) {
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  // Value at Risk (VaR) calculation - simplified
  const portfolioVolatility = Math.sqrt(
    holdings.reduce((sum, h) => {
      const weight = h.quantity * h.currentPrice / totalValue;
      const vol = h.volatility || 0.2;
      return sum + Math.pow(weight * vol, 2);
    }, 0)
  );

  const confidence95VaR = totalValue * portfolioVolatility * 1.645; // 95% confidence
  const confidence99VaR = totalValue * portfolioVolatility * 2.326; // 99% confidence

  // Maximum drawdown estimation
  const maxDrawdown = portfolioVolatility * 2.5; // Simplified estimation

  // Risk concentration analysis
  const concentrationRisks = identifyConcentrationRisks(holdings, totalValue);

  // Correlation risks (simplified)
  const correlationRisk = calculateCorrelationRisk(holdings);

  return {
    var95: parseFloat(confidence95VaR.toFixed(2)),
    var99: parseFloat(confidence99VaR.toFixed(2)),
    maxDrawdownEstimate: parseFloat((maxDrawdown * 100).toFixed(2)),
    portfolioVolatility: parseFloat((portfolioVolatility * 100).toFixed(2)),
    concentrationRisks,
    correlationRisk: parseFloat(correlationRisk.toFixed(2)),
    riskScore: calculateOverallRiskScore(portfolioVolatility, concentrationRisks, correlationRisk),
    riskLevel: portfolioVolatility > 0.25 ? 'High' : portfolioVolatility > 0.15 ? 'Medium' : 'Low'
  };
}

function identifyConcentrationRisks(holdings, totalValue) {
  const risks = [];

  // Position concentration
  holdings.forEach((holding) => {
    const weight = holding.quantity * holding.currentPrice / totalValue;
    if (weight > 0.3) {
      risks.push({
        type: 'Position Concentration',
        symbol: holding.symbol,
        weight: parseFloat((weight * 100).toFixed(2)),
        risk: 'High',
        recommendation: 'Consider reducing position size'
      });
    }
  });

  // Sector concentration
  const sectorWeights = {};
  holdings.forEach((holding) => {
    const sector = holding.sector || 'Unknown';
    const weight = holding.quantity * holding.currentPrice / totalValue;
    sectorWeights[sector] = (sectorWeights[sector] || 0) + weight;
  });

  Object.entries(sectorWeights).forEach(([sector, weight]) => {
    if (weight > 0.4) {
      risks.push({
        type: 'Sector Concentration',
        sector,
        weight: parseFloat((weight * 100).toFixed(2)),
        risk: 'High',
        recommendation: 'Diversify across sectors'
      });
    }
  });

  return risks;
}

function calculateCorrelationRisk(holdings) {
  // Simplified correlation risk based on sector overlap
  const sectors = {};
  holdings.forEach((h) => {
    const sector = h.sector || 'Technology';
    sectors[sector] = (sectors[sector] || 0) + 1;
  });

  const sectorCounts = Object.values(sectors);
  const maxSectorCount = Math.max(...sectorCounts);
  const totalHoldings = holdings.length;

  return maxSectorCount / totalHoldings; // Higher values indicate more correlation risk
}

function calculateOverallRiskScore(volatility, concentrationRisks, correlationRisk) {
  let score = 0;

  // Volatility component (0-40 points)
  score += Math.min(40, volatility * 200);

  // Concentration risk component (0-30 points)
  score += Math.min(30, concentrationRisks.length * 10);

  // Correlation risk component (0-30 points)
  score += Math.min(30, correlationRisk * 30);

  return Math.round(score);
}

function generateRebalancingPlan(holdings, targetWeights, threshold) {
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
  const rebalancingActions = [];

  targetWeights.forEach((target) => {
    const holding = holdings.find((h) => h.symbol === target.symbol);
    if (!holding) return;

    const currentWeight = holding.quantity * holding.currentPrice / totalValue;
    const weightDifference = Math.abs(target.targetWeight - currentWeight);

    if (weightDifference > threshold) {
      const targetValue = totalValue * target.targetWeight;
      const currentValue = holding.quantity * holding.currentPrice;
      const dollarDifference = targetValue - currentValue;
      const sharesChange = Math.round(dollarDifference / holding.currentPrice);

      rebalancingActions.push({
        symbol: holding.symbol,
        action: dollarDifference > 0 ? 'BUY' : 'SELL',
        shares: Math.abs(sharesChange),
        dollarAmount: Math.abs(dollarDifference),
        currentWeight: parseFloat((currentWeight * 100).toFixed(2)),
        targetWeight: parseFloat((target.targetWeight * 100).toFixed(2)),
        priority: weightDifference > threshold * 2 ? 'High' : 'Medium'
      });
    }
  });

  return {
    actions: rebalancingActions.sort((a, b) => b.dollarAmount - a.dollarAmount),
    totalTrades: rebalancingActions.length,
    totalRebalancingCost: rebalancingActions.reduce((sum, action) => sum + action.dollarAmount, 0),
    rebalancingNeeded: rebalancingActions.length > 0
  };
}

function performStressTesting(holdings) {
  const scenarios = [
  { name: 'Market Crash (-20%)', marketChange: -0.20, sectorImpacts: { 'Technology': -0.25, 'Finance': -0.30 } },
  { name: 'Recession (-15%)', marketChange: -0.15, sectorImpacts: { 'Consumer': -0.20, 'Finance': -0.25 } },
  { name: 'Interest Rate Spike', marketChange: -0.10, sectorImpacts: { 'Real Estate': -0.20, 'Utilities': -0.15 } },
  { name: 'Inflation Surge', marketChange: -0.08, sectorImpacts: { 'Technology': -0.12, 'Consumer': -0.10 } }];


  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  const stressResults = scenarios.map((scenario) => {
    let portfolioImpact = 0;

    holdings.forEach((holding) => {
      const currentValue = holding.quantity * holding.currentPrice;
      const sector = holding.sector || 'Technology';
      const sectorImpact = scenario.sectorImpacts[sector] || scenario.marketChange;
      const holdingImpact = currentValue * sectorImpact;
      portfolioImpact += holdingImpact;
    });

    return {
      scenario: scenario.name,
      portfolioImpact: parseFloat(portfolioImpact.toFixed(2)),
      impactPercent: parseFloat((portfolioImpact / totalValue * 100).toFixed(2)),
      newPortfolioValue: parseFloat((totalValue + portfolioImpact).toFixed(2)),
      severity: Math.abs(portfolioImpact / totalValue) > 0.15 ? 'High' :
      Math.abs(portfolioImpact / totalValue) > 0.08 ? 'Medium' : 'Low'
    };
  });

  return {
    scenarios: stressResults,
    worstCaseScenario: stressResults.reduce((worst, current) =>
    current.portfolioImpact < worst.portfolioImpact ? current : worst
    ),
    averageImpact: parseFloat((stressResults.reduce((sum, s) => sum + s.impactPercent, 0) / stressResults.length).toFixed(2))
  };
}

function generateActionableRecommendations(optimization, riskAnalysis, rebalancing) {
  const recommendations = [];

  // Optimization recommendations
  if (optimization.expectedSharpeRatio < 0.5) {
    recommendations.push({
      type: 'Optimization',
      priority: 'High',
      title: 'Improve Risk-Adjusted Returns',
      description: 'Portfolio Sharpe ratio is below optimal levels',
      action: 'Consider rebalancing to improve risk-adjusted returns',
      impact: 'Medium'
    });
  }

  // Risk management recommendations
  if (riskAnalysis.riskLevel === 'High') {
    recommendations.push({
      type: 'Risk Management',
      priority: 'High',
      title: 'Reduce Portfolio Risk',
      description: `Portfolio volatility is ${riskAnalysis.portfolioVolatility}%`,
      action: 'Consider adding defensive positions or reducing high-risk holdings',
      impact: 'High'
    });
  }

  // Concentration risk recommendations
  if (riskAnalysis.concentrationRisks.length > 0) {
    recommendations.push({
      type: 'Diversification',
      priority: 'Medium',
      title: 'Address Concentration Risk',
      description: `${riskAnalysis.concentrationRisks.length} concentration risk(s) identified`,
      action: 'Diversify holdings to reduce concentration risk',
      impact: 'Medium'
    });
  }

  // Rebalancing recommendations
  if (rebalancing.rebalancingNeeded) {
    recommendations.push({
      type: 'Rebalancing',
      priority: 'Medium',
      title: 'Portfolio Rebalancing Required',
      description: `${rebalancing.totalTrades} positions need rebalancing`,
      action: 'Execute rebalancing trades to maintain target allocation',
      impact: 'Low'
    });
  }

  return recommendations.sort((a, b) => {
    const priorities = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorities[b.priority] - priorities[a.priority];
  });
}

function calculateOptimizationScore(targetWeights, profile) {
  // Calculate how well the optimization meets the risk profile
  let score = 100;

  // Penalize for exceeding risk tolerance
  const portfolioVol = Math.sqrt(
    targetWeights.reduce((sum, w) => sum + Math.pow(w.targetWeight * w.volatility, 2), 0)
  );

  if (portfolioVol > profile.maxVolatility) {
    score -= (portfolioVol - profile.maxVolatility) * 200;
  }

  // Reward for meeting target return
  const portfolioReturn = targetWeights.reduce((sum, w) => sum + w.targetWeight * w.expectedReturn, 0);
  if (portfolioReturn >= profile.targetReturn) {
    score += 10;
  } else {
    score -= (profile.targetReturn - portfolioReturn) * 100;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Export the main function
optimizePortfolio;