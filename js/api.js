// js/api.js — BananaHub API client

const API_BASE = 'https://bananahub-api.workers.dev/api';
const TIMEOUT_MS = 5000;
const MAX_CONCURRENCY = 10;

/**
 * Fetch with timeout wrapper
 */
function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Fetch install stats for a single template
 * @param {string} templateId
 * @returns {Promise<{installs: number|string, trending: number|string}>}
 */
export async function fetchStats(templateId) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/stats/${templateId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      installs: typeof data.installs === 'number' ? data.installs : '--',
      trending: typeof data.trending === 'number' ? data.trending : '--'
    };
  } catch {
    return { installs: '--', trending: '--' };
  }
}

/**
 * Fetch trending data for all templates
 * @returns {Promise<Object>} Map of templateId -> trending count
 */
export async function fetchTrending() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/trending`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Fetch stats for all templates in parallel with bounded concurrency
 * @param {string[]} templateIds
 * @returns {Promise<Map<string, {installs: number|string, trending: number|string}>>}
 */
export async function fetchAllStats(templateIds) {
  const results = new Map();
  const queue = [...templateIds];

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      const stats = await fetchStats(id);
      results.set(id, stats);
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, templateIds.length) },
    () => worker()
  );
  await Promise.all(workers);

  return results;
}
