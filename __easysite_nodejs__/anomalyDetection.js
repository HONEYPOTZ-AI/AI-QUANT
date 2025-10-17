
// AI-powered anomaly detection for market data
function detectMarketAnomalies(marketData, sensitivity = 0.8, lookbackPeriod = 50) {
    const anomalies = [];
    const alerts = [];
    
    Object.keys(marketData).forEach(symbol => {
        const data = marketData[symbol];
        const prices = data.prices || [];
        
        if (prices.length < lookbackPeriod) {
            return;
        }
        
        // Price anomaly detection using statistical methods
        const priceAnomalies = detectPriceAnomalies(prices, sensitivity, lookbackPeriod);
        
        // Volume anomaly detection
        const volumeAnomalies = detectVolumeAnomalies(prices, sensitivity, lookbackPeriod);
        
        // Pattern anomaly detection
        const patternAnomalies = detectPatternAnomalies(prices, sensitivity);
        
        // Combine all anomalies
        const symbolAnomalies = [
            ...priceAnomalies,
            ...volumeAnomalies,
            ...patternAnomalies
        ].map(anomaly => ({
            ...anomaly,
            symbol,
            detectedAt: new Date().toISOString()
        }));
        
        anomalies.push(...symbolAnomalies);
        
        // Generate alerts for high-severity anomalies
        symbolAnomalies.forEach(anomaly => {
            if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
                alerts.push({
                    id: `alert_${symbol}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    symbol,
                    type: anomaly.type,
                    severity: anomaly.severity,
                    message: `${anomaly.type} anomaly detected in ${symbol}: ${anomaly.description}`,
                    timestamp: new Date().toISOString(),
                    data: anomaly.data,
                    recommendations: generateRecommendations(anomaly)
                });
            }
        });
    });
    
    return {
        anomalies,
        alerts,
        summary: {
            totalAnomalies: anomalies.length,
            criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
            highAlerts: alerts.filter(a => a.severity === 'high').length,
            analysisTime: new Date().toISOString()
        }
    };
}

function detectPriceAnomalies(prices, sensitivity, lookbackPeriod) {
    const anomalies = [];
    const recentPrices = prices.slice(-lookbackPeriod);
    const closePrices = recentPrices.map(p => p.close);
    
    // Calculate statistical measures
    const mean = closePrices.reduce((a, b) => a + b, 0) / closePrices.length;
    const variance = closePrices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closePrices.length;
    const stdDev = Math.sqrt(variance);
    
    const threshold = stdDev * (2 - sensitivity); // Higher sensitivity = lower threshold
    const currentPrice = closePrices[closePrices.length - 1];
    const deviation = Math.abs(currentPrice - mean);
    
    if (deviation > threshold * 2) {
        anomalies.push({
            type: 'price_spike',
            severity: deviation > threshold * 3 ? 'critical' : 'high',
            description: `Unusual price movement detected. Current price deviates ${(deviation / mean * 100).toFixed(2)}% from average`,
            data: {
                currentPrice,
                mean: mean.toFixed(4),
                deviation: deviation.toFixed(4),
                threshold: threshold.toFixed(4)
            }
        });
    }
    
    // Detect rapid price changes
    const priceChanges = [];
    for (let i = 1; i < recentPrices.length; i++) {
        const change = Math.abs(recentPrices[i].close - recentPrices[i-1].close) / recentPrices[i-1].close;
        priceChanges.push(change);
    }
    
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const lastChange = priceChanges[priceChanges.length - 1];
    
    if (lastChange > avgChange * 3 && lastChange > 0.05) {
        anomalies.push({
            type: 'rapid_price_change',
            severity: lastChange > 0.15 ? 'critical' : 'high',
            description: `Rapid price change detected: ${(lastChange * 100).toFixed(2)}% in last period`,
            data: {
                changePercent: (lastChange * 100).toFixed(2),
                averageChange: (avgChange * 100).toFixed(2)
            }
        });
    }
    
    return anomalies;
}

function detectVolumeAnomalies(prices, sensitivity, lookbackPeriod) {
    const anomalies = [];
    const recentPrices = prices.slice(-lookbackPeriod);
    const volumes = recentPrices.map(p => p.volume);
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    // Unusual volume spike
    if (currentVolume > avgVolume * (2 / sensitivity)) {
        anomalies.push({
            type: 'volume_spike',
            severity: currentVolume > avgVolume * 5 ? 'critical' : 'high',
            description: `Unusual trading volume: ${((currentVolume / avgVolume - 1) * 100).toFixed(0)}% above average`,
            data: {
                currentVolume,
                averageVolume: Math.round(avgVolume),
                ratio: (currentVolume / avgVolume).toFixed(2)
            }
        });
    }
    
    return anomalies;
}

function detectPatternAnomalies(prices, sensitivity) {
    const anomalies = [];
    
    if (prices.length < 10) return anomalies;
    
    const recentPrices = prices.slice(-10);
    const closes = recentPrices.map(p => p.close);
    
    // Detect unusual patterns
    const isConsistentTrend = checkConsistentTrend(closes);
    const hasGaps = checkForGaps(recentPrices);
    
    if (isConsistentTrend.detected && isConsistentTrend.strength > 0.8) {
        anomalies.push({
            type: 'unusual_trend_pattern',
            severity: 'medium',
            description: `Unusual ${isConsistentTrend.direction} trend pattern detected with ${(isConsistentTrend.strength * 100).toFixed(0)}% consistency`,
            data: isConsistentTrend
        });
    }
    
    if (hasGaps.detected) {
        anomalies.push({
            type: 'price_gap',
            severity: hasGaps.maxGap > 0.1 ? 'high' : 'medium',
            description: `Price gaps detected. Largest gap: ${(hasGaps.maxGap * 100).toFixed(2)}%`,
            data: hasGaps
        });
    }
    
    return anomalies;
}

function checkConsistentTrend(prices) {
    let upCount = 0;
    let downCount = 0;
    
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i-1]) upCount++;
        else if (prices[i] < prices[i-1]) downCount++;
    }
    
    const total = prices.length - 1;
    const upStrength = upCount / total;
    const downStrength = downCount / total;
    
    return {
        detected: Math.max(upStrength, downStrength) > 0.7,
        direction: upStrength > downStrength ? 'upward' : 'downward',
        strength: Math.max(upStrength, downStrength),
        consecutivePeriods: total
    };
}

function checkForGaps(prices) {
    const gaps = [];
    
    for (let i = 1; i < prices.length; i++) {
        const prevHigh = prices[i-1].high;
        const prevLow = prices[i-1].low;
        const currOpen = prices[i].open;
        const currLow = prices[i].low;
        const currHigh = prices[i].high;
        
        // Gap up
        if (currLow > prevHigh) {
            gaps.push({
                type: 'gap_up',
                size: (currLow - prevHigh) / prevHigh,
                period: i
            });
        }
        // Gap down
        else if (currHigh < prevLow) {
            gaps.push({
                type: 'gap_down',
                size: (prevLow - currHigh) / prevLow,
                period: i
            });
        }
    }
    
    return {
        detected: gaps.length > 0,
        gaps,
        count: gaps.length,
        maxGap: gaps.length > 0 ? Math.max(...gaps.map(g => g.size)) : 0
    };
}

function generateRecommendations(anomaly) {
    const recommendations = [];
    
    switch (anomaly.type) {
        case 'price_spike':
            recommendations.push('Consider reviewing recent news and market events');
            recommendations.push('Monitor for potential reversal patterns');
            recommendations.push('Adjust risk management parameters');
            break;
        case 'volume_spike':
            recommendations.push('Investigate potential catalysts driving volume');
            recommendations.push('Monitor for continuation of trend');
            recommendations.push('Consider liquidity implications');
            break;
        case 'rapid_price_change':
            recommendations.push('Implement dynamic stop-loss adjustments');
            recommendations.push('Review position sizing');
            recommendations.push('Monitor for market stability');
            break;
    }
    
    return recommendations;
}

// Export the main function
detectMarketAnomalies;
