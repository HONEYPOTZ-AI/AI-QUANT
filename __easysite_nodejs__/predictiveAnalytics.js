
// Advanced predictive analytics for market forecasting
function generatePredictiveInsights(marketData, horizon = 24, confidence = 0.85) {
  const insights = {};
  const predictions = [];
  const models = ['linear_regression', 'moving_average', 'momentum', 'mean_reversion'];

  Object.keys(marketData).forEach((symbol) => {
    const data = marketData[symbol];
    const prices = data.prices || [];

    if (prices.length < 20) {
      insights[symbol] = {
        error: 'Insufficient data for prediction',
        dataPoints: prices.length
      };
      return;
    }

    // Generate predictions using multiple models
    const modelPredictions = {};
    const closePrices = prices.map((p) => p.close);

    // Linear Regression Model
    modelPredictions.linear_regression = linearRegressionPredict(closePrices, horizon);

    // Moving Average Model
    modelPredictions.moving_average = movingAveragePredict(closePrices, horizon);

    // Momentum Model
    modelPredictions.momentum = momentumPredict(closePrices, horizon);

    // Mean Reversion Model
    modelPredictions.mean_reversion = meanReversionPredict(closePrices, horizon);

    // Ensemble prediction (weighted average)
    const ensemblePrediction = calculateEnsemblePrediction(modelPredictions, confidence);

    // Calculate prediction confidence and risk metrics
    const riskMetrics = calculateRiskMetrics(closePrices, ensemblePrediction);

    // Generate trading signals
    const signals = generateTradingSignals(data, ensemblePrediction, riskMetrics);

    insights[symbol] = {
      symbol,
      currentPrice: data.currentPrice,
      predictions: {
        ensemble: ensemblePrediction,
        individual_models: modelPredictions
      },
      riskMetrics,
      signals,
      confidence: confidence * 100,
      horizon: `${horizon} hours`,
      generatedAt: new Date().toISOString()
    };

    predictions.push({
      symbol,
      predictedChange: ensemblePrediction.predictedChange,
      confidence: ensemblePrediction.confidence,
      timeframe: `${horizon}h`,
      signal: signals.primary
    });
  });

  return {
    insights,
    summary: {
      totalPredictions: predictions.length,
      averageConfidence: predictions.length > 0 ?
      (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(2) : 0,
      bullishSignals: predictions.filter((p) => p.signal === 'BUY').length,
      bearishSignals: predictions.filter((p) => p.signal === 'SELL').length,
      neutralSignals: predictions.filter((p) => p.signal === 'HOLD').length
    },
    topPredictions: predictions.
    sort((a, b) => b.confidence - a.confidence).
    slice(0, 10)
  };
}

function linearRegressionPredict(prices, horizon) {
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;

  // Calculate linear regression coefficients
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predictedPrice = slope * (n + horizon - 1) + intercept;
  const currentPrice = prices[prices.length - 1];
  const predictedChange = (predictedPrice - currentPrice) / currentPrice;

  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const residualSumSquares = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const rSquared = 1 - residualSumSquares / totalSumSquares;

  return {
    predictedPrice: predictedPrice.toFixed(4),
    predictedChange: (predictedChange * 100).toFixed(2),
    confidence: Math.max(0, Math.min(100, rSquared * 100)).toFixed(2),
    model: 'linear_regression'
  };
}

function movingAveragePredict(prices, horizon) {
  const shortPeriod = 10;
  const longPeriod = 20;

  if (prices.length < longPeriod) {
    return {
      predictedPrice: prices[prices.length - 1],
      predictedChange: '0.00',
      confidence: '50.00',
      model: 'moving_average'
    };
  }

  const shortMA = prices.slice(-shortPeriod).reduce((a, b) => a + b, 0) / shortPeriod;
  const longMA = prices.slice(-longPeriod).reduce((a, b) => a + b, 0) / longPeriod;

  const trend = (shortMA - longMA) / longMA;
  const currentPrice = prices[prices.length - 1];
  const predictedPrice = currentPrice * (1 + trend * (horizon / 24));
  const predictedChange = (predictedPrice - currentPrice) / currentPrice;

  // Calculate confidence based on trend strength
  const trendStrength = Math.abs(trend);
  const confidence = Math.min(90, 50 + trendStrength * 1000);

  return {
    predictedPrice: predictedPrice.toFixed(4),
    predictedChange: (predictedChange * 100).toFixed(2),
    confidence: confidence.toFixed(2),
    model: 'moving_average'
  };
}

function momentumPredict(prices, horizon) {
  if (prices.length < 10) {
    return {
      predictedPrice: prices[prices.length - 1],
      predictedChange: '0.00',
      confidence: '50.00',
      model: 'momentum'
    };
  }

  const recentPrices = prices.slice(-10);
  const momentum = [];

  for (let i = 1; i < recentPrices.length; i++) {
    momentum.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
  }

  const avgMomentum = momentum.reduce((a, b) => a + b, 0) / momentum.length;
  const currentPrice = prices[prices.length - 1];
  const predictedPrice = currentPrice * Math.pow(1 + avgMomentum, horizon / 24);
  const predictedChange = (predictedPrice - currentPrice) / currentPrice;

  // Calculate confidence based on momentum consistency
  const momentumVariance = momentum.reduce((sum, m) => sum + Math.pow(m - avgMomentum, 2), 0) / momentum.length;
  const confidence = Math.max(30, 80 - momentumVariance * 10000);

  return {
    predictedPrice: predictedPrice.toFixed(4),
    predictedChange: (predictedChange * 100).toFixed(2),
    confidence: confidence.toFixed(2),
    model: 'momentum'
  };
}

function meanReversionPredict(prices, horizon) {
  if (prices.length < 50) {
    return {
      predictedPrice: prices[prices.length - 1],
      predictedChange: '0.00',
      confidence: '50.00',
      model: 'mean_reversion'
    };
  }

  const longTermMean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const currentPrice = prices[prices.length - 1];
  const deviation = (currentPrice - longTermMean) / longTermMean;

  // Assume mean reversion with decay
  const reversionSpeed = 0.1; // 10% reversion per day
  const timeDecay = Math.exp(-reversionSpeed * horizon / 24);
  const predictedDeviation = deviation * timeDecay;
  const predictedPrice = longTermMean * (1 + predictedDeviation);
  const predictedChange = (predictedPrice - currentPrice) / currentPrice;

  // Confidence based on how far from mean
  const confidence = Math.min(85, 50 + Math.abs(deviation) * 100);

  return {
    predictedPrice: predictedPrice.toFixed(4),
    predictedChange: (predictedChange * 100).toFixed(2),
    confidence: confidence.toFixed(2),
    model: 'mean_reversion'
  };
}

function calculateEnsemblePrediction(modelPredictions, confidence) {
  const models = Object.keys(modelPredictions);
  const weights = {
    linear_regression: 0.3,
    moving_average: 0.25,
    momentum: 0.25,
    mean_reversion: 0.2
  };

  let weightedPrice = 0;
  let weightedChange = 0;
  let avgConfidence = 0;
  let totalWeight = 0;

  models.forEach((model) => {
    const pred = modelPredictions[model];
    const weight = weights[model] || 0.25;

    weightedPrice += parseFloat(pred.predictedPrice) * weight;
    weightedChange += parseFloat(pred.predictedChange) * weight;
    avgConfidence += parseFloat(pred.confidence) * weight;
    totalWeight += weight;
  });

  return {
    predictedPrice: (weightedPrice / totalWeight).toFixed(4),
    predictedChange: (weightedChange / totalWeight).toFixed(2),
    confidence: (avgConfidence / totalWeight).toFixed(2),
    model: 'ensemble',
    contributingModels: models.length
  };
}

function calculateRiskMetrics(prices, prediction) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const volatility = Math.sqrt(returns.reduce((sum, r) => {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    return sum + Math.pow(r - mean, 2);
  }, 0) / returns.length);

  const currentPrice = prices[prices.length - 1];
  const predictedPrice = parseFloat(prediction.predictedPrice);
  const expectedReturn = parseFloat(prediction.predictedChange) / 100;

  return {
    volatility: (volatility * 100).toFixed(4),
    sharpeRatio: expectedReturn > 0 ? (expectedReturn / volatility).toFixed(4) : '0.0000',
    maxDrawdown: calculateMaxDrawdown(prices).toFixed(4),
    valueAtRisk: (currentPrice * volatility * 1.645).toFixed(4), // 95% VaR
    expectedReturn: expectedReturn.toFixed(4)
  };
}

function calculateMaxDrawdown(prices) {
  let maxDrawdown = 0;
  let peak = prices[0];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown * 100;
}

function generateTradingSignals(data, prediction, riskMetrics) {
  const predictedChange = parseFloat(prediction.predictedChange);
  const confidence = parseFloat(prediction.confidence);
  const volatility = parseFloat(riskMetrics.volatility);

  let primary = 'HOLD';
  const signals = [];

  // Primary signal based on predicted change and confidence
  if (predictedChange > 2 && confidence > 70) {
    primary = 'BUY';
    signals.push('Strong upward momentum predicted');
  } else if (predictedChange < -2 && confidence > 70) {
    primary = 'SELL';
    signals.push('Strong downward momentum predicted');
  } else if (Math.abs(predictedChange) > 1 && confidence > 60) {
    primary = predictedChange > 0 ? 'BUY' : 'SELL';
    signals.push('Moderate price movement expected');
  }

  // Risk-adjusted signals
  if (volatility > 5) {
    signals.push('High volatility detected - use caution');
  }

  if (confidence < 50) {
    signals.push('Low prediction confidence - consider waiting');
  }

  return {
    primary,
    strength: Math.min(100, confidence + Math.abs(predictedChange) * 10),
    signals,
    riskLevel: volatility > 5 ? 'high' : volatility > 2 ? 'medium' : 'low'
  };
}

// Export the main function
generatePredictiveInsights;