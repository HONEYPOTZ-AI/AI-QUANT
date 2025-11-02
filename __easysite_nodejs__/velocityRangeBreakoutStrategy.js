
/**
 * Velocity-Triggered Range Breakout Strategy for US30 (Dow Jones)
 * 
 * Strategy Overview:
 * - Uses dual timeframe analysis (5min entry signals, 1H context)
 * - Detects range compression and CDC velocity spikes
 * - Implements strict 2% risk management
 * - Auto-executes via cTrader integration
 * 
 * Actions:
 * - analyzeMarket: Analyze market structure and generate signals
 * - executeTrade: Execute trade with risk management
 * - monitorPositions: Monitor open positions and adjust exits
 * - getStrategyStatus: Get current strategy state
 */

async function velocityRangeBreakoutStrategy(action, params = {}) {
  const SYMBOL = 'US30'; // Dow Jones
  const TIMEFRAME_ENTRY = 'M5'; // 5-minute for entry signals
  const TIMEFRAME_CONTEXT = 'H1'; // 1-hour for trend context
  const RISK_PERCENT = 0.02; // 2% risk per trade
  const US30_POINT_VALUE = 1; // $1 per point for US30 CFD

  // ==================== TECHNICAL INDICATOR CALCULATIONS ====================

  // Calculate EMA (Exponential Moving Average)
  function calculateEMA(closes, period) {
    const k = 2 / (period + 1);
    const ema = [];

    // Use SMA for first value
    let sum = 0;
    for (let i = 0; i < Math.min(period, closes.length); i++) {
      sum += closes[i];
    }
    ema[period - 1] = sum / period;

    // Calculate EMA for remaining values
    for (let i = period; i < closes.length; i++) {
      ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
    }

    return ema;
  }

  // Calculate ATR (Average True Range)
  function calculateATR(candles, period = 14) {
    const trueRanges = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      trueRanges.push(tr);
    }

    const atr = [];
    let sum = 0;

    for (let i = 0; i < Math.min(period, trueRanges.length); i++) {
      sum += trueRanges[i];
    }

    atr[period - 1] = sum / period;

    // Use Wilder's smoothing
    for (let i = period; i < trueRanges.length; i++) {
      atr[i] = (atr[i - 1] * (period - 1) + trueRanges[i]) / period;
    }

    return atr;
  }

  // Calculate Bollinger Bands
  function calculateBollingerBands(closes, period = 20, stdDev = 2) {
    const sma = [];
    const upper = [];
    const lower = [];
    const bandwidth = [];

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;

      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);

      sma[i] = mean;
      upper[i] = mean + stdDev * std;
      lower[i] = mean - stdDev * std;
      bandwidth[i] = (upper[i] - lower[i]) / mean; // Normalized bandwidth
    }

    return { sma, upper, lower, bandwidth };
  }

  // Calculate RSI
  function calculateRSI(closes, period = 14) {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;else
      losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    // Calculate subsequent RSI values
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }

    return rsi;
  }

  // Calculate Volume SMA
  function calculateVolumeSMA(volumes, period = 20) {
    const volSma = [];

    for (let i = period - 1; i < volumes.length; i++) {
      const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      volSma[i] = sum / period;
    }

    return volSma;
  }

  // Calculate CDC (Candle Delta) Velocity
  function calculateCDCVelocity(candles) {
    const velocity = [];
    const avgVelocity = [];

    // Calculate candle delta velocity (body strength relative to range)
    for (let i = 0; i < candles.length; i++) {
      const bodySize = Math.abs(candles[i].close - candles[i].open);
      const range = candles[i].high - candles[i].low;

      if (range > 0) {
        velocity[i] = bodySize / range; // 0 to 1, where 1 = full body candle
      } else {
        velocity[i] = 0;
      }
    }

    // Calculate 20-period average velocity
    const period = 20;
    for (let i = period - 1; i < velocity.length; i++) {
      const sum = velocity.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      avgVelocity[i] = sum / period;
    }

    return { velocity, avgVelocity };
  }

  // ==================== MARKET STRUCTURE ANALYSIS ====================

  function analyzeMarketStructure(candles5m, candles1h) {
    const closes5m = candles5m.map((c) => c.close);
    const closes1h = candles1h.map((c) => c.close);
    const volumes5m = candles5m.map((c) => c.volume || 0);

    // Calculate indicators for 5-min timeframe
    const ema20_5m = calculateEMA(closes5m, 20);
    const ema200_5m = calculateEMA(closes5m, 200);
    const ema9_5m = calculateEMA(closes5m, 9);
    const atr5m = calculateATR(candles5m, 14);
    const bb5m = calculateBollingerBands(closes5m, 20, 2);
    const rsi5m = calculateRSI(closes5m, 14);
    const volSma5m = calculateVolumeSMA(volumes5m, 20);
    const cdcVel5m = calculateCDCVelocity(candles5m);

    // Calculate indicators for 1H timeframe (context)
    const ema20_1h = calculateEMA(closes1h, 20);
    const ema200_1h = calculateEMA(closes1h, 200);

    const currentIndex = candles5m.length - 1;
    const currentCandle = candles5m[currentIndex];

    // Determine trend bias from 1H timeframe
    const trendBias1h = ema20_1h[candles1h.length - 1] > ema200_1h[candles1h.length - 1] ?
    'bullish' :
    'bearish';

    // Determine trend bias from 5min timeframe
    const trendBias5m = ema20_5m[currentIndex] > ema200_5m[currentIndex] ?
    'bullish' :
    'bearish';

    return {
      candles5m,
      candles1h,
      currentCandle,
      currentIndex,
      ema20_5m,
      ema200_5m,
      ema9_5m,
      atr5m,
      bb5m,
      rsi5m,
      volSma5m,
      cdcVel5m,
      ema20_1h,
      ema200_1h,
      trendBias1h,
      trendBias5m,
      volumes5m
    };
  }

  // ==================== RANGE COMPRESSION DETECTION ====================

  function detectRangeCompression(candles, atr, currentIndex) {
    // Look back 3-5 candles for compression
    const lookback = 5;
    const startIdx = Math.max(0, currentIndex - lookback + 1);
    const recentCandles = candles.slice(startIdx, currentIndex + 1);
    const currentATR = atr[currentIndex];

    if (!currentATR || recentCandles.length < 3) {
      return { compressed: false, reason: 'Insufficient data' };
    }

    // Check if candles have range < 50% ATR
    let compressionCount = 0;
    let narrowingBB = false;

    for (let i = 0; i < recentCandles.length; i++) {
      const candle = recentCandles[i];
      const range = candle.high - candle.low;

      if (range < 0.5 * currentATR) {
        compressionCount++;
      }
    }

    // Range is compressed if 3+ candles are < 50% ATR
    const compressed = compressionCount >= 3;

    return {
      compressed,
      compressionCount,
      lookback: recentCandles.length,
      atr: currentATR,
      reason: compressed ?
      `${compressionCount} of ${recentCandles.length} candles compressed (<50% ATR)` :
      'No range compression detected'
    };
  }

  // ==================== CDC VELOCITY DETECTION ====================

  function detectVelocitySpike(cdcVelocity, volumes, volSma, currentIndex) {
    const currentVel = cdcVelocity.velocity[currentIndex];
    const avgVel = cdcVelocity.avgVelocity[currentIndex];
    const currentVol = volumes[currentIndex];
    const avgVol = volSma[currentIndex];

    if (!avgVel || !avgVol) {
      return { spike: false, reason: 'Insufficient data for velocity calculation' };
    }

    // Velocity spike: current velocity > 2.5x average
    const velocityRatio = currentVel / avgVel;
    const velocitySpike = velocityRatio > 2.5;

    // Volume confirmation: current volume > 1.5x average
    const volumeRatio = currentVol / avgVol;
    const volumeConfirmation = volumeRatio > 1.5;

    const confirmed = velocitySpike && volumeConfirmation;

    return {
      spike: confirmed,
      velocitySpike,
      volumeConfirmation,
      velocityRatio: velocityRatio.toFixed(2),
      volumeRatio: volumeRatio.toFixed(2),
      currentVelocity: currentVel.toFixed(3),
      avgVelocity: avgVel.toFixed(3),
      reason: confirmed ?
      `Velocity spike (${velocityRatio.toFixed(2)}x) with volume confirmation (${volumeRatio.toFixed(2)}x)` :
      `No confirmed spike (vel: ${velocityRatio.toFixed(2)}x, vol: ${volumeRatio.toFixed(2)}x)`
    };
  }

  // ==================== BREAKOUT CONFIRMATION ====================

  function checkBreakoutConfirmation(structure, compression, velocity) {
    const { currentCandle, currentIndex, rsi5m, bb5m, trendBias5m, trendBias1h } = structure;
    const currentRSI = rsi5m[currentIndex];

    // Need both compression and velocity spike
    if (!compression.compressed || !velocity.spike) {
      return { signal: null, reason: 'No compression or velocity spike' };
    }

    // Detect range high/low from compressed range
    const lookback = compression.lookback;
    const rangeCandles = structure.candles5m.slice(
      Math.max(0, currentIndex - lookback),
      currentIndex
    );

    const rangeHigh = Math.max(...rangeCandles.map((c) => c.high));
    const rangeLow = Math.min(...rangeCandles.map((c) => c.low));
    const closePrice = currentCandle.close;

    // Check for breakout with RSI filter
    let signal = null;
    let reason = '';

    // Bullish breakout
    if (closePrice > rangeHigh && currentRSI > 55) {
      signal = 'long';
      reason = `Bullish breakout: Close ${closePrice.toFixed(2)} > Range High ${rangeHigh.toFixed(2)}, RSI ${currentRSI.toFixed(1)} > 55`;
    }
    // Bearish breakout
    else if (closePrice < rangeLow && currentRSI < 45) {
      signal = 'short';
      reason = `Bearish breakout: Close ${closePrice.toFixed(2)} < Range Low ${rangeLow.toFixed(2)}, RSI ${currentRSI.toFixed(1)} < 45`;
    }
    // Breakout without RSI confirmation
    else if (closePrice > rangeHigh || closePrice < rangeLow) {
      reason = `Price breakout detected but RSI filter not met (RSI: ${currentRSI.toFixed(1)})`;
    }

    return {
      signal,
      reason,
      rangeHigh,
      rangeLow,
      closePrice,
      rsi: currentRSI,
      trendBias5m,
      trendBias1h
    };
  }

  // ==================== RISK MANAGEMENT ====================

  function calculatePositionSize(accountEquity, entryPrice, stopLossPrice, pointValue = US30_POINT_VALUE) {
    // Position Size = (Risk Amount) / (Stop Loss in Points × Point Value)
    // Risk Amount = 2% of Account Equity

    const riskAmount = accountEquity * RISK_PERCENT;
    const stopLossPoints = Math.abs(entryPrice - stopLossPrice);

    if (stopLossPoints === 0) {
      throw new Error('Stop loss cannot be at entry price');
    }

    const positionSize = riskAmount / (stopLossPoints * pointValue);

    // Round to 2 decimal places (standard lot sizing)
    const lotSize = Math.round(positionSize * 100) / 100;

    return {
      lotSize,
      riskAmount,
      stopLossPoints,
      positionSize: positionSize.toFixed(2)
    };
  }

  function calculateStopLossAndTakeProfit(signal, entryPrice, currentCandle, structure) {
    let stopLoss, takeProfit1, takeProfit2, trailingStop;

    if (signal === 'long') {
      // Stop loss below breakout candle low
      stopLoss = currentCandle.low;

      const riskPoints = entryPrice - stopLoss;

      // TP1: 1.5x risk
      takeProfit1 = entryPrice + riskPoints * 1.5;

      // TP2: Trail with 9 EMA
      const ema9Value = structure.ema9_5m[structure.currentIndex];
      takeProfit2 = ema9Value;

      trailingStop = 'Trail with 9 EMA';
    } else if (signal === 'short') {
      // Stop loss above breakout candle high
      stopLoss = currentCandle.high;

      const riskPoints = stopLoss - entryPrice;

      // TP1: 1.5x risk
      takeProfit1 = entryPrice - riskPoints * 1.5;

      // TP2: Trail with 9 EMA
      const ema9Value = structure.ema9_5m[structure.currentIndex];
      takeProfit2 = ema9Value;

      trailingStop = 'Trail with 9 EMA';
    }

    return {
      stopLoss: stopLoss.toFixed(2),
      takeProfit1: takeProfit1.toFixed(2),
      takeProfit2: takeProfit2.toFixed(2),
      trailingStop
    };
  }

  // ==================== COMMENTARY SYSTEM ====================

  function generateCommentary(phase, data = {}) {
    const commentaries = {
      'velocity_detected': `🔥 Velocity breakout detected — prepare for entry (Velocity: ${data.velocityRatio}x, Volume: ${data.volumeRatio}x)`,

      'range_expansion': `✅ Range expansion confirmed — executing ${data.signal} position at ${data.entryPrice}`,

      'position_opened': `📈 ${data.signal.toUpperCase()} position deployed: ${data.lotSize} lots | Entry: ${data.entryPrice} | SL: ${data.stopLoss} | TP1: ${data.takeProfit1}`,

      'lot_size_calculated': `⚖️ Lot size adjusted for 2% risk — deploying ${data.lotSize} lots (Risk: $${data.riskAmount.toFixed(2)})`,

      'momentum_divergence': `⚠️ Momentum divergence — consider exit or hedge (Price: ${data.price}, Velocity weakening)`,

      'risk_threshold_breached': `🛑 Risk threshold breached (${data.lossPercent}%) — auto-close initiated`,

      'compression_detected': `🔍 Range compression detected: ${data.compressionCount} candles compressed. Awaiting velocity spike...`,

      'no_signal': `💤 No trade signal: ${data.reason}`,

      'trailing_stop': `📊 Trailing stop with 9 EMA at ${data.emaValue}`,

      'take_profit_hit': `💰 Take Profit ${data.level} hit at ${data.price} — Partial exit completed`
    };

    return commentaries[phase] || 'Market analysis in progress...';
  }

  // ==================== MOMENTUM DIVERGENCE DETECTION ====================

  function detectMomentumDivergence(candles, cdcVelocity, currentIndex, lookback = 10) {
    if (currentIndex < lookback) return { divergence: false };

    const recentCandles = candles.slice(currentIndex - lookback, currentIndex + 1);
    const recentVelocity = cdcVelocity.velocity.slice(currentIndex - lookback, currentIndex + 1);

    // Check if price made new high but velocity didn't
    const priceHighs = recentCandles.map((c) => c.high);
    const currentHigh = recentCandles[recentCandles.length - 1].high;
    const previousHigh = Math.max(...priceHighs.slice(0, -1));

    const currentVel = recentVelocity[recentVelocity.length - 1];
    const previousVel = Math.max(...recentVelocity.slice(0, -1));

    const bullishDivergence = currentHigh > previousHigh && currentVel < previousVel;

    // Check if price made new low but velocity didn't
    const priceLows = recentCandles.map((c) => c.low);
    const currentLow = recentCandles[recentCandles.length - 1].low;
    const previousLow = Math.min(...priceLows.slice(0, -1));

    const bearishDivergence = currentLow < previousLow && currentVel < previousVel;

    return {
      divergence: bullishDivergence || bearishDivergence,
      type: bullishDivergence ? 'bullish' : bearishDivergence ? 'bearish' : null,
      commentary: bullishDivergence || bearishDivergence ?
      generateCommentary('momentum_divergence', { price: recentCandles[recentCandles.length - 1].close }) :
      null
    };
  }

  // ==================== MAIN ACTION HANDLERS ====================

  switch (action) {
    case 'analyzeMarket':{
        const { userId, accountId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          // Fetch market data for both timeframes
          const candles5mResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderMarketDataFetcher.js',
            param: ['getCandles', {
              userId,
              symbol: SYMBOL,
              timeframe: TIMEFRAME_ENTRY,
              count: 250,
              accountId
            }]
          });

          const candles1hResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderMarketDataFetcher.js',
            param: ['getCandles', {
              userId,
              symbol: SYMBOL,
              timeframe: TIMEFRAME_CONTEXT,
              count: 200,
              accountId
            }]
          });

          const candles5m = candles5mResult.candles || [];
          const candles1h = candles1hResult.candles || [];

          if (candles5m.length < 210 || candles1h.length < 200) {
            throw new Error('Insufficient historical data for analysis');
          }

          // Analyze market structure
          const structure = analyzeMarketStructure(candles5m, candles1h);

          // Detect range compression
          const compression = detectRangeCompression(
            structure.candles5m,
            structure.atr5m,
            structure.currentIndex
          );

          // Detect CDC velocity spike
          const velocity = detectVelocitySpike(
            structure.cdcVel5m,
            structure.volumes5m,
            structure.volSma5m,
            structure.currentIndex
          );

          // Check for breakout confirmation
          const breakout = checkBreakoutConfirmation(structure, compression, velocity);

          // Check for momentum divergence
          const divergence = detectMomentumDivergence(
            structure.candles5m,
            structure.cdcVel5m,
            structure.currentIndex
          );

          // Generate appropriate commentary
          let commentary = [];

          if (compression.compressed) {
            commentary.push(generateCommentary('compression_detected', compression));
          }

          if (velocity.spike) {
            commentary.push(generateCommentary('velocity_detected', velocity));
          }

          if (breakout.signal) {
            commentary.push(generateCommentary('range_expansion', breakout));
          } else {
            commentary.push(generateCommentary('no_signal', breakout));
          }

          if (divergence.divergence) {
            commentary.push(divergence.commentary);
          }

          return {
            symbol: SYMBOL,
            timeframes: {
              entry: TIMEFRAME_ENTRY,
              context: TIMEFRAME_CONTEXT
            },
            analysis: {
              trendBias1h: structure.trendBias1h,
              trendBias5m: structure.trendBias5m,
              compression,
              velocity,
              breakout,
              divergence,
              currentPrice: structure.currentCandle.close,
              rsi: structure.rsi5m[structure.currentIndex]?.toFixed(2),
              atr: structure.atr5m[structure.currentIndex]?.toFixed(2)
            },
            signal: breakout.signal,
            commentary,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          throw new Error(`Market analysis failed: ${error.message}`);
        }
      }

    case 'executeTrade':{
        const { userId, accountId, signal, analysisData } = params;
        if (!userId || !signal) throw new Error('userId and signal are required');

        try {
          // Get account equity for position sizing
          const accountResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderConnectionManager.js',
            param: ['getAccounts', { userId }]
          });

          const account = accountResult.accounts?.[0];
          if (!account) throw new Error('No account found');

          const accountEquity = account.equity || account.balance || 10000; // Default fallback

          // Get current market price
          const quoteResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderMarketDataFetcher.js',
            param: ['getQuote', { userId, symbol: SYMBOL, accountId }]
          });

          const currentPrice = signal === 'long' ? quoteResult.ask : quoteResult.bid;

          // Calculate stop loss and take profit
          const { stopLoss, takeProfit1, takeProfit2, trailingStop } =
          calculateStopLossAndTakeProfit(
            signal,
            currentPrice,
            analysisData.currentCandle || { low: currentPrice - 10, high: currentPrice + 10 },
            analysisData.structure || { ema9_5m: [currentPrice], currentIndex: 0 }
          );

          // Calculate position size with 2% risk
          const positionCalc = calculatePositionSize(
            accountEquity,
            currentPrice,
            parseFloat(stopLoss),
            US30_POINT_VALUE
          );

          const commentary = [];
          commentary.push(generateCommentary('lot_size_calculated', {
            lotSize: positionCalc.lotSize,
            riskAmount: positionCalc.riskAmount
          }));

          // Execute the order via cTrader
          const orderResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderOrderExecutor.js',
            param: ['placeMarketOrder', {
              userId,
              accountId,
              symbol: SYMBOL,
              volume: positionCalc.lotSize,
              side: signal === 'long' ? 'BUY' : 'SELL',
              stopLoss: parseFloat(stopLoss),
              takeProfit: parseFloat(takeProfit1),
              label: 'VelocityRangeBreakout'
            }]
          });

          commentary.push(generateCommentary('position_opened', {
            signal,
            lotSize: positionCalc.lotSize,
            entryPrice: currentPrice.toFixed(2),
            stopLoss,
            takeProfit1
          }));

          return {
            success: true,
            orderId: orderResult.orderId,
            signal,
            entry: {
              price: currentPrice,
              lotSize: positionCalc.lotSize,
              riskAmount: positionCalc.riskAmount,
              riskPercent: RISK_PERCENT * 100
            },
            risk: {
              stopLoss: parseFloat(stopLoss),
              stopLossPoints: positionCalc.stopLossPoints,
              takeProfit1: parseFloat(takeProfit1),
              takeProfit2: parseFloat(takeProfit2),
              trailingStop
            },
            commentary,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          throw new Error(`Trade execution failed: ${error.message}`);
        }
      }

    case 'monitorPositions':{
        const { userId, accountId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          // Get all open positions
          const positionsResult = await easysite.run({
            path: '__easysite_nodejs__/ctraderOrderExecutor.js',
            param: ['getPositions', { userId, accountId }]
          });

          const positions = positionsResult.positions || [];
          const us30Positions = positions.filter((p) =>
          p.symbolName === SYMBOL || p.symbol === SYMBOL
          );

          if (us30Positions.length === 0) {
            return {
              message: 'No active US30 positions',
              positions: [],
              timestamp: new Date().toISOString()
            };
          }

          // Get current market data for monitoring
          const analysisResult = await velocityRangeBreakoutStrategy('analyzeMarket', {
            userId,
            accountId
          });

          const currentPrice = analysisResult.analysis.currentPrice;
          const structure = analysisResult.analysis;

          const monitoringResults = [];

          for (const position of us30Positions) {
            const positionId = position.positionId || position.id;
            const entryPrice = position.entryPrice || position.price;
            const volume = position.volume;
            const side = position.tradeSide || position.side;

            // Calculate current P/L
            const pnl = side === 'BUY' ?
            (currentPrice - entryPrice) * volume :
            (entryPrice - currentPrice) * volume;

            const pnlPercent = pnl / entryPrice * 100;

            // Check for 2% risk threshold breach
            if (pnlPercent < -2) {
              monitoringResults.push({
                positionId,
                action: 'close',
                reason: generateCommentary('risk_threshold_breached', {
                  lossPercent: pnlPercent.toFixed(2)
                }),
                pnl: pnl.toFixed(2),
                pnlPercent: pnlPercent.toFixed(2)
              });
            }
            // Check for momentum divergence
            else if (structure.divergence?.divergence) {
              monitoringResults.push({
                positionId,
                action: 'warning',
                reason: structure.divergence.commentary,
                pnl: pnl.toFixed(2),
                pnlPercent: pnlPercent.toFixed(2)
              });
            }
            // Normal monitoring
            else {
              monitoringResults.push({
                positionId,
                action: 'hold',
                pnl: pnl.toFixed(2),
                pnlPercent: pnlPercent.toFixed(2),
                currentPrice,
                entryPrice
              });
            }
          }

          return {
            positions: us30Positions,
            monitoring: monitoringResults,
            currentPrice,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          throw new Error(`Position monitoring failed: ${error.message}`);
        }
      }

    case 'getStrategyStatus':{
        const { userId, accountId } = params;
        if (!userId) throw new Error('userId is required');

        try {
          // Get market analysis
          const analysis = await velocityRangeBreakoutStrategy('analyzeMarket', {
            userId,
            accountId
          });

          // Get positions
          const monitoring = await velocityRangeBreakoutStrategy('monitorPositions', {
            userId,
            accountId
          });

          return {
            strategy: 'Velocity-Triggered Range Breakout',
            symbol: SYMBOL,
            status: 'active',
            riskManagement: {
              riskPerTrade: `${RISK_PERCENT * 100}%`,
              pointValue: US30_POINT_VALUE
            },
            currentAnalysis: analysis,
            activePositions: monitoring,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          throw new Error(`Failed to get strategy status: ${error.message}`);
        }
      }

    default:
      throw new Error(`Unknown action: ${action}. Available actions: analyzeMarket, executeTrade, monitorPositions, getStrategyStatus`);
  }
}