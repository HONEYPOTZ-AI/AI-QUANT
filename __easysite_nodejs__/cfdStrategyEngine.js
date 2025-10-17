function cfdStrategyEngine(marketData) {
  // Input: marketData array of objects with {timestamp, open, high, low, close, volume}
  // Output: signals array with {timestamp, type, price, rsi, macd, volume, commentary}

  if (!marketData || marketData.length < 50) {
    throw new Error("Insufficient market data. At least 50 bars required.");
  }

  // Helper function: Calculate EMA
  function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [];
    ema[0] = data[0];

    for (let i = 1; i < data.length; i++) {
      ema[i] = data[i] * k + ema[i - 1] * (1 - k);
    }

    return ema;
  }

  // Helper function: Calculate RSI
  function calculateRSI(closes, period = 14) {
    const rsi = [];
    let gains = 0;
    let losses = 0;

    // First RSI calculation
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;else
      losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = 0; i < period; i++) {
      rsi[i] = null;
    }

    rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    // Subsequent RSI calculations using Wilder's smoothing
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

  // Helper function: Calculate MACD
  function calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);

    const macdLine = emaFast.map((val, i) => val - emaSlow[i]);
    const signalLine = calculateEMA(macdLine, signal);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);

    return { macdLine, signalLine, histogram };
  }

  // Helper function: Calculate ATR
  function calculateATR(data, period = 14) {
    const trueRanges = [];

    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      trueRanges.push(tr);
    }

    const atr = [null];
    let sum = 0;

    for (let i = 0; i < period; i++) {
      sum += trueRanges[i];
    }

    atr.push(sum / period);

    for (let i = period; i < trueRanges.length; i++) {
      atr.push((atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period);
    }

    return atr;
  }

  // Helper function: Calculate Velocity (price momentum)
  function calculateVelocity(closes, period = 1) {
    const velocity = [null];

    for (let i = period; i < closes.length; i++) {
      velocity.push(closes[i] - closes[i - period]);
    }

    return velocity;
  }

  // Helper function: Calculate Volume Average
  function calculateVolumeAverage(volumes, period = 20) {
    const volAvg = [];

    for (let i = 0; i < period - 1; i++) {
      volAvg.push(null);
    }

    for (let i = period - 1; i < volumes.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += volumes[i - j];
      }
      volAvg.push(sum / period);
    }

    return volAvg;
  }

  // Extract data arrays
  const closes = marketData.map((d) => d.close);
  const volumes = marketData.map((d) => d.volume);

  // Calculate all indicators
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const atr = calculateATR(marketData, 14);
  const velocity = calculateVelocity(closes, 1);
  const volumeAvg = calculateVolumeAverage(volumes, 20);

  // Generate signals
  const signals = [];

  // Start from index where all indicators are available
  const startIndex = 26; // MACD needs at least 26 bars

  for (let i = startIndex; i < marketData.length; i++) {
    const currentBar = marketData[i];
    const range = currentBar.high - currentBar.low;

    // Check if we have all required data
    if (rsi[i] === null || atr[i] === null || velocity[i] === null || volumeAvg[i] === null) {
      continue;
    }

    const vel = velocity[i];
    const atrVal = atr[i];
    const rsiVal = rsi[i];
    const macdLine = macd.macdLine[i];
    const signalLine = macd.signalLine[i];
    const prevMacdLine = macd.macdLine[i - 1];
    const prevSignalLine = macd.signalLine[i - 1];
    const vol = currentBar.volume;
    const volAvg = volumeAvg[i];

    // Check for MACD crossovers
    const macdCrossUp = prevMacdLine <= prevSignalLine && macdLine > signalLine;
    const macdCrossDown = prevMacdLine >= prevSignalLine && macdLine < signalLine;

    // Long Signal (Breakout)
    if (
    vel > 1.5 * atrVal &&
    range < 1.2 * atrVal &&
    rsiVal > 55 &&
    macdCrossUp &&
    vol > volAvg)
    {
      const commentary = `Long trade at ${currentBar.timestamp}: Velocity breakout confirmed with RSI ${rsiVal.toFixed(2)}, MACD crossover up, and volume spike.`;

      signals.push({
        timestamp: currentBar.timestamp,
        type: 'long',
        price: currentBar.close,
        rsi: parseFloat(rsiVal.toFixed(2)),
        macd: parseFloat(macdLine.toFixed(4)),
        volume: vol,
        commentary
      });
    }

    // Short Signal (Reversal)
    if (
    vel < -1.5 * atrVal &&
    range < 1.2 * atrVal &&
    rsiVal < 45 &&
    macdCrossDown &&
    vol > volAvg)
    {
      const commentary = `Short trade at ${currentBar.timestamp}: Velocity reversal confirmed with RSI ${rsiVal.toFixed(2)}, MACD crossover down, and volume spike.`;

      signals.push({
        timestamp: currentBar.timestamp,
        type: 'short',
        price: currentBar.close,
        rsi: parseFloat(rsiVal.toFixed(2)),
        macd: parseFloat(macdLine.toFixed(4)),
        volume: vol,
        commentary
      });
    }
  }

  return signals;
}