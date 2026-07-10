/**
 * Prediction Service — API client for the AI fuel queue prediction backend.
 * Provides caching, formatting, and helper functions for all prediction endpoints.
 */

// Backend URL — adjust for your environment
const API_BASE = 'http://localhost:5000/api/predictions';

// Simple in-memory cache (5-minute TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get AI prediction for a single station.
 * @param {string} stationId
 * @param {number} queueCount - Current vehicle count
 * @param {number} [hour] - Hour of day (0-23), defaults to current hour
 * @returns {Promise<Object>} prediction result
 */
export async function getStationPrediction(stationId, queueCount, hour) {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  const cacheKey = `station_${stationId}_${currentHour}_${queueCount}`;
  
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/station`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stationId, hour: currentHour, queueCount }),
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn('Prediction API error:', error.message);
    // Return fallback prediction
    return generateFallbackPrediction(stationId, currentHour, queueCount);
  }
}

/**
 * Get hourly predictions for the busy-hour chart.
 * @param {string} stationId
 * @param {number} queueCount
 * @returns {Promise<Object>} hourly prediction data
 */
export async function getHourlyPredictions(stationId, queueCount = 15) {
  const cacheKey = `hourly_${stationId}_${queueCount}`;
  
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${API_BASE}/hourly/${stationId}?queueCount=${queueCount}`
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn('Hourly prediction API error:', error.message);
    return generateFallbackHourly(stationId, queueCount);
  }
}

/**
 * Get the best time to visit a station today.
 * @param {string} stationId
 * @param {number} queueCount
 * @returns {Promise<Object>} best time recommendation
 */
export async function getBestTimeToVisit(stationId, queueCount = 15) {
  const cacheKey = `besttime_${stationId}_${queueCount}`;
  
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${API_BASE}/best-time/${stationId}?queueCount=${queueCount}`
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn('Best time API error:', error.message);
    return {
      bestTimeWindow: { startLabel: '1:00 PM', endLabel: '3:00 PM', avgWaitMinutes: 8 },
      recommendation: 'Best to visit between 1:00 PM – 3:00 PM',
    };
  }
}

/**
 * Get predictions for multiple stations at once.
 * @param {Array} stations - Array of { stationId, queueCount }
 * @param {number} [hour] - Hour of day
 * @returns {Promise<Object>} bulk prediction results
 */
export async function getBulkPredictions(stations, hour) {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  const cacheKey = `bulk_${currentHour}_${stations.map(s => s.stationId).join(',')}`;
  
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stations, hour: currentHour }),
    });
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.warn('Bulk prediction API error:', error.message);
    return generateFallbackBulk(stations, currentHour);
  }
}

/**
 * Clear prediction cache (useful after reporting queue changes).
 */
export function clearPredictionCache() {
  cache.clear();
}

// ─── Fallback Predictions (when API is unreachable) ─────────────
function generateFallbackPrediction(stationId, hour, queueCount) {
  const wait = estimateWait(hour, queueCount);
  return {
    stationId,
    prediction: {
      estimatedWaitMinutes: wait,
      queueStatus: wait < 10 ? 'LOW' : wait < 25 ? 'MEDIUM' : 'HIGH',
      confidence: 0.6,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    },
    input: { hour, queueCount },
  };
}

function generateFallbackHourly(stationId, queueCount) {
  const hourlyPredictions = [];
  for (let h = 0; h < 24; h++) {
    const wait = estimateWait(h, queueCount);
    hourlyPredictions.push({
      hour: h,
      label: formatHour(h),
      estimatedWaitMinutes: wait,
      queueStatus: wait < 10 ? 'LOW' : wait < 25 ? 'MEDIUM' : 'HIGH',
    });
  }
  return {
    stationId,
    queueCount,
    hourlyPredictions,
    bestTimeWindow: { start: 13, end: 15, startLabel: '1 PM', endLabel: '3 PM', avgWaitMinutes: 8 },
    isFallback: true,
  };
}

function generateFallbackBulk(stations, hour) {
  const predictions = stations.map(s => {
    const wait = estimateWait(hour, s.queueCount || 10);
    return {
      stationId: s.stationId,
      estimatedWaitMinutes: wait,
      queueStatus: wait < 10 ? 'LOW' : wait < 25 ? 'MEDIUM' : 'HIGH',
      queueCount: s.queueCount || 10,
    };
  });
  predictions.sort((a, b) => a.estimatedWaitMinutes - b.estimatedWaitMinutes);
  return { predictions, hour, bestStation: predictions[0], isFallback: true };
}

function estimateWait(hour, queueCount) {
  let multiplier = 1.0;
  if (hour >= 7 && hour <= 9) multiplier = 1.8;
  else if (hour >= 17 && hour <= 19) multiplier = 2.0;
  else if (hour >= 12 && hour <= 14) multiplier = 1.3;
  else if (hour >= 22 || hour <= 5) multiplier = 0.4;
  
  return Math.round(queueCount * 1.5 * multiplier * 10) / 10;
}

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}
