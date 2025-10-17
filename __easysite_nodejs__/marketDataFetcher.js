
// Real-time market data fetching and aggregation
function fetchRealTimeMarketData(symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'], dataTypes = ['price', 'volume', 'indicators']) {
  const marketData = {};
  const timestamp = new Date().toISOString();

  // Simulate real-time data with realistic market behavior
  symbols.forEach((symbol) => {
    const baseData = generateRealtimeData(symbol);

    marketData[symbol] = {
      symbol,
      timestamp,
      ...baseData,
      dataTypes: dataTypes,
      source: 'real-time-simulator',
      latency: Math.floor(Math.random() * 100) + 10, // 10-110ms latency
      quality: 'high'
    };
  });

  // Add market summary
  const marketSummary = calculateMarketSummary(marketData);

  // Add correlation matrix
  const correlationMatrix = calculateCorrelationMatrix(symbols, marketData);

  return {
    data: marketData,
    summary: marketSummary,
    correlations: correlationMatrix,
    metadata: {
      totalSymbols: symbols.length,
      dataTypes,
      fetchTime: timestamp,
      nextUpdate: new Date(Date.now() + 60000).toISOString(), // Next update in 1 minute
      status: 'active'
    }
  };
}

function generateRealtimeData(symbol) {
  // Create realistic base prices for different symbols
  const basePrices = {
    'AAPL': 175.0,
    'GOOGL': 140.0,
    'MSFT': 340.0,
    'TSLA': 250.0,
    'NVDA': 450.0,
    'AMZN': 145.0,
    'META': 320.0,
    'NFLX': 400.0
  };

  const basePrice = basePrices[symbol] || Math.random() * 500 + 50;
  const now = Date.now();

  // Market hours effect (simulate different volatility during different times)
  const hour = new Date().getHours();
  const isMarketHours = hour >= 9 && hour <= 16;
  const volatilityMultiplier = isMarketHours ? 1.0 : 0.3;

  // Generate price with realistic intraday movement
  const dailyVolatility = 0.02 + Math.random() * 0.03; // 2-5% daily volatility
  const priceChange = (Math.random() - 0.5) * dailyVolatility * volatilityMultiplier;
  const currentPrice = basePrice * (1 + priceChange);

  // Generate volume with realistic patterns
  const baseVolume = Math.floor(Math.random() * 5000000 + 1000000); // 1M-6M base volume
  const volumeMultiplier = isMarketHours ? 1 + Math.random() * 2 : 0.1;
  const currentVolume = Math.floor(baseVolume * volumeMultiplier);

  // Generate OHLC data
  const high = currentPrice * (1 + Math.random() * 0.01);
  const low = currentPrice * (1 - Math.random() * 0.01);
  const open = low + (high - low) * Math.random();

  // Calculate technical indicators
  const indicators = generateTechnicalIndicators(symbol, currentPrice);

  // Market sentiment simulation
  const sentiment = calculateMarketSentiment(symbol, priceChange);

  return {
    price: {
      current: parseFloat(currentPrice.toFixed(4)),
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      change: parseFloat((priceChange * 100).toFixed(2)),
      changePercent: parseFloat((priceChange * 100).toFixed(2))
    },
    volume: {
      current: currentVolume,
      average: Math.floor(baseVolume),
      ratio: parseFloat((currentVolume / baseVolume).toFixed(2))
    },
    indicators,
    sentiment,
    metadata: {
      marketHours: isMarketHours,
      volatility: parseFloat((dailyVolatility * 100).toFixed(2)),
      lastUpdate: now,
      dataAge: 0 // Real-time data
    }
  };
}

function generateTechnicalIndicators(symbol, currentPrice) {
  // Simulate technical indicators based on current price
  const rsi = 30 + Math.random() * 40; // RSI between 30-70
  const macd = (Math.random() - 0.5) * 2; // MACD line
  const bollinger = {
    upper: currentPrice * 1.02,
    middle: currentPrice,
    lower: currentPrice * 0.98
  };

  const movingAverages = {
    sma20: currentPrice * (0.98 + Math.random() * 0.04),
    sma50: currentPrice * (0.96 + Math.random() * 0.08),
    ema12: currentPrice * (0.99 + Math.random() * 0.02),
    ema26: currentPrice * (0.97 + Math.random() * 0.06)
  };

  return {
    rsi: parseFloat(rsi.toFixed(2)),
    macd: parseFloat(macd.toFixed(4)),
    bollingerBands: bollinger,
    movingAverages,
    stochastic: {
      k: Math.random() * 100,
      d: Math.random() * 100
    },
    adx: 20 + Math.random() * 60, // ADX between 20-80
    williamsR: -Math.random() * 100 // Williams %R between -100 and 0
  };
}

function calculateMarketSentiment(symbol, priceChange) {
  // Simulate market sentiment based on price movement and random factors
  let sentiment = 'neutral';
  let score = 50; // Neutral score

  // Adjust based on price movement
  if (priceChange > 0.02) {
    sentiment = 'bullish';
    score = 60 + Math.random() * 30;
  } else if (priceChange < -0.02) {
    sentiment = 'bearish';
    score = 10 + Math.random() * 30;
  } else {
    score = 40 + Math.random() * 20;
  }

  // Add some randomness for news/events effect
  const newsImpact = (Math.random() - 0.5) * 20;
  score = Math.max(0, Math.min(100, score + newsImpact));

  if (score > 65) sentiment = 'bullish';else
  if (score < 35) sentiment = 'bearish';else
  sentiment = 'neutral';

  return {
    sentiment,
    score: parseFloat(score.toFixed(1)),
    confidence: parseFloat((60 + Math.random() * 30).toFixed(1)),
    factors: generateSentimentFactors(sentiment)
  };
}

function generateSentimentFactors(sentiment) {
  const factors = [];
  const allFactors = {
    bullish: [
    'Strong earnings report',
    'Positive analyst upgrades',
    'Market momentum',
    'Sector strength',
    'Technical breakout'],

    bearish: [
    'Earnings miss',
    'Analyst downgrades',
    'Market headwinds',
    'Sector weakness',
    'Technical breakdown'],

    neutral: [
    'Mixed signals',
    'Awaiting catalysts',
    'Sideways trading',
    'Low volume',
    'Range-bound']

  };

  const relevantFactors = allFactors[sentiment] || allFactors.neutral;
  const numFactors = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numFactors; i++) {
    const randomIndex = Math.floor(Math.random() * relevantFactors.length);
    factors.push(relevantFactors[randomIndex]);
  }

  return factors;
}

function calculateMarketSummary(marketData) {
  const symbols = Object.keys(marketData);
  let totalVolume = 0;
  let avgChange = 0;
  let bullishCount = 0;
  let bearishCount = 0;

  symbols.forEach((symbol) => {
    const data = marketData[symbol];
    totalVolume += data.volume.current;
    avgChange += data.price.changePercent;

    if (data.sentiment.sentiment === 'bullish') bullishCount++;else
    if (data.sentiment.sentiment === 'bearish') bearishCount++;
  });

  avgChange /= symbols.length;

  return {
    totalSymbols: symbols.length,
    marketTrend: avgChange > 0.5 ? 'bullish' : avgChange < -0.5 ? 'bearish' : 'neutral',
    averageChange: parseFloat(avgChange.toFixed(2)),
    totalVolume,
    bullishStocks: bullishCount,
    bearishStocks: bearishCount,
    neutralStocks: symbols.length - bullishCount - bearishCount,
    marketMomentum: parseFloat(((bullishCount - bearishCount) / symbols.length * 100).toFixed(1))
  };
}

function calculateCorrelationMatrix(symbols, marketData) {
  const correlations = {};

  // Simple correlation simulation based on sector relationships
  symbols.forEach((symbol1) => {
    correlations[symbol1] = {};
    symbols.forEach((symbol2) => {
      if (symbol1 === symbol2) {
        correlations[symbol1][symbol2] = 1.0;
      } else {
        // Simulate correlation based on similar price movements
        const price1 = marketData[symbol1].price.changePercent;
        const price2 = marketData[symbol2].price.changePercent;

        // Add some sector correlation logic
        const sectorCorrelation = getSectorCorrelation(symbol1, symbol2);
        const priceCorrelation = Math.abs(price1 - price2) < 1 ? 0.7 : 0.3;

        correlations[symbol1][symbol2] = parseFloat(
          (sectorCorrelation * 0.6 + priceCorrelation * 0.4).toFixed(3)
        );
      }
    });
  });

  return correlations;
}

function getSectorCorrelation(symbol1, symbol2) {
  const sectors = {
    'AAPL': 'tech',
    'GOOGL': 'tech',
    'MSFT': 'tech',
    'NVDA': 'tech',
    'TSLA': 'automotive',
    'AMZN': 'retail',
    'META': 'tech',
    'NFLX': 'media'
  };

  const sector1 = sectors[symbol1] || 'other';
  const sector2 = sectors[symbol2] || 'other';

  return sector1 === sector2 ? 0.8 : 0.2;
}

// Export the main function
fetchRealTimeMarketData;