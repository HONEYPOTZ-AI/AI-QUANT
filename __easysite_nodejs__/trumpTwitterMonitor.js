import axios from "npm:axios@1.7.2";

// Configuration
const TWITTER_USER_ID = '25073877'; // @realDonaldTrump user ID
const TWITTER_USERNAME = 'realDonaldTrump';
const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RESULTS = 10; // Tweets per fetch
const IMPORTANT_KEYWORDS = ['BREAKING', 'URGENT', 'IMPORTANT', 'ALERT', 'MAJOR', 'CRITICAL', 'ANNOUNCEMENT'];

// Monitoring state
let monitoringInterval = null;
let isMonitoring = false;
let lastFetchTime = null;
let rateLimitReset = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

/**
 * Initialize Twitter API client with authentication
 */
function getTwitterClient() {
  const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
  const apiKey = Deno.env.get('TWITTER_API_KEY');
  const apiSecret = Deno.env.get('TWITTER_API_SECRET');

  if (!bearerToken && (!apiKey || !apiSecret)) {
    throw new Error(
      'Twitter API credentials not configured. Please set TWITTER_BEARER_TOKEN or both TWITTER_API_KEY and TWITTER_API_SECRET in environment variables.'
    );
  }

  const headers = bearerToken
    ? { 'Authorization': `Bearer ${bearerToken}` }
    : { 'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}` };

  return axios.create({
    baseURL: 'https://api.twitter.com/2',
    headers: headers,
    timeout: 30000,
  });
}

/**
 * Fetch recent tweets from @realDonaldTrump using Twitter API v2
 */
async function fetchRecentTweets() {
  const client = getTwitterClient();
  
  try {
    console.log(`[Twitter Monitor] Fetching tweets from @${TWITTER_USERNAME}...`);
    
    // Build query parameters for Twitter API v2
    const params = {
      max_results: MAX_RESULTS,
      'tweet.fields': 'id,text,created_at,public_metrics,entities',
      'media.fields': 'url,preview_image_url',
      expansions: 'attachments.media_keys',
    };

    // If we have a last fetch time, only get tweets since then
    if (lastFetchTime) {
      params.start_time = new Date(lastFetchTime).toISOString();
    }

    // Fetch tweets from user timeline
    const response = await client.get(`/users/${TWITTER_USER_ID}/tweets`, { params });

    // Handle rate limiting
    const rateLimitRemaining = parseInt(response.headers['x-rate-limit-remaining'] || '0');
    const rateLimitResetTime = parseInt(response.headers['x-rate-limit-reset'] || '0') * 1000;
    
    rateLimitReset = rateLimitResetTime;

    console.log(`[Twitter Monitor] Rate limit remaining: ${rateLimitRemaining}`);

    if (rateLimitRemaining < 5) {
      const waitTime = Math.max(0, rateLimitResetTime - Date.now());
      console.warn(`[Twitter Monitor] Rate limit low. Will pause until ${new Date(rateLimitResetTime).toISOString()}`);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
      }
    }

    // Parse response
    const tweets = response.data?.data || [];
    const includes = response.data?.includes || {};
    const mediaMap = {};

    // Map media
    if (includes.media) {
      includes.media.forEach(media => {
        mediaMap[media.media_key] = media.url || media.preview_image_url || '';
      });
    }

    console.log(`[Twitter Monitor] Fetched ${tweets.length} tweet(s)`);
    
    return { tweets, mediaMap, success: true };

  } catch (error) {
    console.error('[Twitter Monitor] Error fetching tweets:', error.message);

    // Handle specific Twitter API errors
    if (error.response?.status === 429) {
      const resetTime = parseInt(error.response.headers['x-rate-limit-reset'] || '0') * 1000;
      rateLimitReset = resetTime;
      throw new Error(`Rate limit exceeded. Resets at ${new Date(resetTime).toISOString()}`);
    }

    if (error.response?.status === 401) {
      throw new Error('Twitter API authentication failed. Check your credentials.');
    }

    if (error.response?.status === 403) {
      throw new Error('Twitter API access forbidden. Check your API permissions.');
    }

    throw new Error(`Failed to fetch tweets: ${error.message}`);
  }
}

/**
 * Check if tweet contains important keywords
 */
function isImportantTweet(text) {
  const upperText = text.toUpperCase();
  return IMPORTANT_KEYWORDS.some(keyword => upperText.includes(keyword));
}

/**
 * Extract media URLs from tweet
 */
function extractMediaUrls(tweet, mediaMap) {
  const mediaUrls = [];
  
  if (tweet.attachments?.media_keys) {
    tweet.attachments.media_keys.forEach(key => {
      if (mediaMap[key]) {
        mediaUrls.push(mediaMap[key]);
      }
    });
  }

  return mediaUrls;
}

/**
 * Save tweets to database
 */
async function saveTweets(tweets, mediaMap) {
  if (!tweets || tweets.length === 0) {
    console.log('[Twitter Monitor] No new tweets to save');
    return { saved: 0 };
  }

  let savedCount = 0;
  let skippedCount = 0;

  for (const tweet of tweets) {
    try {
      // Check if tweet already exists
      const { data: existing } = await easysite.table.page(73738, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: 'tweet_id', op: 'Equal', value: tweet.id }
        ]
      });

      if (existing && existing.List.length > 0) {
        console.log(`[Twitter Monitor] Tweet ${tweet.id} already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Extract media URLs
      const mediaUrls = extractMediaUrls(tweet, mediaMap);

      // Prepare tweet data
      const tweetData = {
        tweet_id: tweet.id,
        content: tweet.text,
        posted_at: tweet.created_at,
        media_urls: JSON.stringify(mediaUrls),
        retweet_count: tweet.public_metrics?.retweet_count || 0,
        like_count: tweet.public_metrics?.like_count || 0,
        reply_count: tweet.public_metrics?.reply_count || 0,
        url: `https://twitter.com/${TWITTER_USERNAME}/status/${tweet.id}`,
        is_important: isImportantTweet(tweet.text),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database
      const { error } = await easysite.table.create(73738, tweetData);

      if (error) {
        console.error(`[Twitter Monitor] Error saving tweet ${tweet.id}:`, error);
        continue;
      }

      savedCount++;
      console.log(`[Twitter Monitor] Saved tweet ${tweet.id} (important: ${tweetData.is_important})`);

    } catch (error) {
      console.error(`[Twitter Monitor] Error processing tweet ${tweet.id}:`, error.message);
    }
  }

  console.log(`[Twitter Monitor] Saved ${savedCount} tweet(s), skipped ${skippedCount} duplicate(s)`);
  return { saved: savedCount, skipped: skippedCount };
}

/**
 * Perform a single fetch and save cycle
 */
async function performFetch() {
  try {
    // Check if we're in rate limit cooldown
    if (rateLimitReset && Date.now() < rateLimitReset) {
      const waitSeconds = Math.ceil((rateLimitReset - Date.now()) / 1000);
      console.log(`[Twitter Monitor] In rate limit cooldown. ${waitSeconds}s remaining`);
      return { 
        success: false, 
        message: `Rate limit cooldown. Wait ${waitSeconds}s`,
        inCooldown: true 
      };
    }

    // Fetch tweets
    const { tweets, mediaMap, success } = await fetchRecentTweets();

    if (!success) {
      throw new Error('Failed to fetch tweets');
    }

    // Update last fetch time
    lastFetchTime = new Date().toISOString();

    // Save tweets to database
    const result = await saveTweets(tweets, mediaMap);

    // Reset error counter on success
    consecutiveErrors = 0;

    return {
      success: true,
      timestamp: lastFetchTime,
      fetched: tweets.length,
      ...result
    };

  } catch (error) {
    consecutiveErrors++;
    console.error(`[Twitter Monitor] Fetch error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error.message);

    // Stop monitoring if too many consecutive errors
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error('[Twitter Monitor] Too many consecutive errors. Stopping monitoring.');
      stopMonitoring();
      return {
        success: false,
        error: error.message,
        stopped: true,
        message: 'Monitoring stopped due to repeated failures'
      };
    }

    return {
      success: false,
      error: error.message,
      consecutiveErrors
    };
  }
}

/**
 * Start monitoring Twitter for new tweets
 * @returns {Object} Status of monitoring service
 */
export async function startMonitoring() {
  if (isMonitoring) {
    return {
      success: false,
      message: 'Monitoring is already running',
      status: 'active',
      interval: FETCH_INTERVAL_MS / 1000
    };
  }

  try {
    // Verify credentials
    getTwitterClient();

    // Perform initial fetch
    console.log('[Twitter Monitor] Starting monitoring service...');
    const initialResult = await performFetch();

    // Set up interval
    monitoringInterval = setInterval(async () => {
      await performFetch();
    }, FETCH_INTERVAL_MS);

    isMonitoring = true;
    consecutiveErrors = 0;

    console.log(`[Twitter Monitor] Monitoring started. Checking every ${FETCH_INTERVAL_MS / 1000} seconds`);

    return {
      success: true,
      message: 'Monitoring started successfully',
      status: 'active',
      interval: FETCH_INTERVAL_MS / 1000,
      initialFetch: initialResult
    };

  } catch (error) {
    console.error('[Twitter Monitor] Failed to start monitoring:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Failed to start monitoring'
    };
  }
}

/**
 * Stop monitoring Twitter
 * @returns {Object} Status of monitoring service
 */
export function stopMonitoring() {
  if (!isMonitoring && !monitoringInterval) {
    return {
      success: false,
      message: 'Monitoring is not running',
      status: 'inactive'
    };
  }

  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }

  isMonitoring = false;
  console.log('[Twitter Monitor] Monitoring stopped');

  return {
    success: true,
    message: 'Monitoring stopped successfully',
    status: 'inactive',
    lastFetchTime
  };
}

/**
 * Get latest tweets from database
 * @param {number} limit - Number of tweets to retrieve (default: 20)
 * @returns {Object} Latest tweets from database
 */
export async function getLatestTweets(limit = 20) {
  try {
    const { data, error } = await easysite.table.page(73738, {
      PageNo: 1,
      PageSize: limit,
      OrderByField: 'posted_at',
      IsAsc: false
    });

    if (error) {
      throw new Error(`Failed to fetch tweets from database: ${error}`);
    }

    // Parse media URLs from JSON strings
    const tweets = (data?.List || []).map(tweet => ({
      ...tweet,
      media_urls: JSON.parse(tweet.media_urls || '[]')
    }));

    return {
      success: true,
      tweets,
      count: tweets.length,
      total: data?.VirtualCount || 0
    };

  } catch (error) {
    console.error('[Twitter Monitor] Error fetching tweets from database:', error.message);
    return {
      success: false,
      error: error.message,
      tweets: []
    };
  }
}

/**
 * Manually trigger a fetch cycle
 * @returns {Object} Result of manual fetch
 */
export async function manualFetch() {
  try {
    console.log('[Twitter Monitor] Manual fetch triggered');
    const result = await performFetch();
    
    return {
      ...result,
      manual: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Twitter Monitor] Manual fetch failed:', error.message);
    return {
      success: false,
      error: error.message,
      manual: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get monitoring status
 * @returns {Object} Current monitoring status
 */
export function getMonitoringStatus() {
  return {
    isMonitoring,
    lastFetchTime,
    rateLimitReset: rateLimitReset ? new Date(rateLimitReset).toISOString() : null,
    consecutiveErrors,
    interval: FETCH_INTERVAL_MS / 1000,
    nextFetch: isMonitoring && lastFetchTime 
      ? new Date(new Date(lastFetchTime).getTime() + FETCH_INTERVAL_MS).toISOString()
      : null
  };
}

// Export all functions
export default {
  startMonitoring,
  stopMonitoring,
  getLatestTweets,
  manualFetch,
  getMonitoringStatus
};