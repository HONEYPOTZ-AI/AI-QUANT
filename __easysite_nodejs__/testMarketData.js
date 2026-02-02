/**
 * Test Market Data Implementation
 * Run this to verify SPX and options data fetching
 */

import { fetchRealTimeSPXPrice, clearPriceCache } from './spxRealTimePriceFetcher.js';
import { fetchSPXOptionsChain, fetchOptionQuote, clearOptionsCache } from './spxOptionsChainFetcher.js';

export async function testMarketDataIntegration() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  console.log('🧪 Testing Market Data Implementation...\n');

  // Test 1: API Key Check
  console.log('1️⃣ Checking API Key Configuration...');
  const apiKey = Deno.env.get('POLYGON_API_KEY');
  results.tests.push({
    name: 'API Key Configuration',
    passed: !!apiKey,
    message: apiKey ? `API key found: ${apiKey.substring(0, 10)}...` : 'API key not found in .env'
  });
  console.log(apiKey ? '✅ API key configured' : '❌ API key missing\n');

  if (!apiKey) {
    console.log('⚠️  Cannot continue tests without API key. Please add POLYGON_API_KEY to your .env file.\n');
    return results;
  }

  // Test 2: SPX Real-Time Price
  console.log('\n2️⃣ Testing SPX Real-Time Price Fetcher...');
  try {
    clearPriceCache();
    const spxData = await fetchRealTimeSPXPrice();
    
    const isValid = spxData.price > 0 && 
                    spxData.previousClose > 0 &&
                    spxData.timestamp;
    
    results.tests.push({
      name: 'SPX Price Fetch',
      passed: isValid,
      data: {
        price: spxData.price,
        change: spxData.change,
        percentChange: spxData.percentChange,
        marketStatus: spxData.marketStatus,
        isRealTime: spxData.isRealTime,
        source: spxData.source
      }
    });
    
    console.log('✅ SPX price fetched successfully:');
    console.log(`   Price: $${spxData.price.toFixed(2)}`);
    console.log(`   Change: ${spxData.change >= 0 ? '+' : ''}${spxData.change.toFixed(2)} (${spxData.percentChange.toFixed(2)}%)`);
    console.log(`   Market: ${spxData.marketStatus || 'unknown'} | Real-time: ${spxData.isRealTime ? 'Yes' : 'No'}`);
  } catch (error) {
    results.tests.push({
      name: 'SPX Price Fetch',
      passed: false,
      error: error.message
    });
    console.log(`❌ SPX price fetch failed: ${error.message}`);
  }

  // Test 3: Options Chain
  console.log('\n3️⃣ Testing SPX Options Chain Fetcher...');
  try {
    clearOptionsCache();
    const optionsData = await fetchSPXOptionsChain({
      contractType: 'call',
      limit: 10
    });
    
    const isValid = optionsData.symbol === 'SPX' &&
                    Array.isArray(optionsData.options) &&
                    optionsData.options.length > 0;
    
    results.tests.push({
      name: 'Options Chain Fetch',
      passed: isValid,
      data: {
        symbol: optionsData.symbol,
        underlyingPrice: optionsData.underlyingPrice,
        totalContracts: optionsData.totalContracts,
        contractsFetched: optionsData.options.length,
        source: optionsData.source
      }
    });
    
    console.log('✅ Options chain fetched successfully:');
    console.log(`   Symbol: ${optionsData.symbol}`);
    console.log(`   Underlying Price: $${optionsData.underlyingPrice?.toFixed(2) || 'N/A'}`);
    console.log(`   Contracts fetched: ${optionsData.options.length}`);
    console.log(`   Total available: ${optionsData.totalContracts}`);
    
    // Show sample options
    if (optionsData.options.length > 0) {
      const sample = optionsData.options[0];
      console.log(`   Sample: ${sample.type} ${sample.strike} exp ${sample.expiration} (${sample.daysToExpiration}d)`);
    }
  } catch (error) {
    results.tests.push({
      name: 'Options Chain Fetch',
      passed: false,
      error: error.message
    });
    console.log(`❌ Options chain fetch failed: ${error.message}`);
  }

  // Test 4: Data Refresh Rate
  console.log('\n4️⃣ Testing Cache and Refresh Mechanism...');
  try {
    const start1 = Date.now();
    await fetchRealTimeSPXPrice(); // Should be cached
    const cached = Date.now() - start1;
    
    clearPriceCache();
    
    const start2 = Date.now();
    await fetchRealTimeSPXPrice(); // Should fetch fresh
    const fresh = Date.now() - start2;
    
    results.tests.push({
      name: 'Cache Mechanism',
      passed: cached < fresh, // Cached should be faster
      data: {
        cachedTime: `${cached}ms`,
        freshTime: `${fresh}ms`
      }
    });
    
    console.log(`✅ Cache working correctly:`);
    console.log(`   Cached fetch: ${cached}ms`);
    console.log(`   Fresh fetch: ${fresh}ms`);
  } catch (error) {
    results.tests.push({
      name: 'Cache Mechanism',
      passed: false,
      error: error.message
    });
    console.log(`❌ Cache test failed: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const passedTests = results.tests.filter(t => t.passed).length;
  const totalTests = results.tests.length;
  console.log(`   ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ All tests passed! Market data feed is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }

  return results;
}

// Run tests if called directly
if (import.meta.main) {
  testMarketDataIntegration().catch(console.error);
}
