// js/api.js - BananaHub API client

const API_BASE = 'https://bananahub-api.zhan9kun.workers.dev/api';
const TIMEOUT_MS = 5000;
const MAX_CONCURRENCY = 10;
const EMPTY_STATS = {
  installs: null,
  trending: null,
  usageTotal: null,
  usage24h: null,
  usageUnique: null
};

function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function getTemplateKey(template) {
  return `${template.repo || 'unknown'}::${template.id}`;
}

function supportsInstallStats(template) {
  return Boolean(template?.repo && template?.id && template?.distribution !== 'bundled');
}

function supportsUsageStats(template) {
  return Boolean(template?.repo && template?.id && template?.distribution === 'bundled');
}

function buildStatsUrl(template) {
  const url = new URL(`${API_BASE}/stats`);
  url.searchParams.set('repo', template.repo);
  url.searchParams.set('template_id', template.id);
  return url.toString();
}

export async function fetchStats(template) {
  if (!supportsInstallStats(template)) {
    return { ...EMPTY_STATS };
  }

  try {
    const res = await fetchWithTimeout(buildStatsUrl(template));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      installs: typeof data.installs === 'number' ? data.installs : null,
      trending: null
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

function buildUsageStatsUrl(template) {
  const url = new URL(`${API_BASE}/usage-stats`);
  url.searchParams.set('repo', template.repo);
  url.searchParams.set('template_id', template.id);
  return url.toString();
}

export async function fetchUsageStats(template) {
  if (!supportsUsageStats(template)) {
    return { ...EMPTY_STATS };
  }

  try {
    const res = await fetchWithTimeout(buildUsageStatsUrl(template));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      installs: null,
      trending: null,
      usageTotal: typeof data.success_total === 'number' ? data.success_total : 0,
      usage24h: typeof data.success_24h === 'number' ? data.success_24h : 0,
      usageUnique: typeof data.selected?.unique === 'number' ? data.selected.unique : 0
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export async function fetchTrending() {
  try {
    const url = new URL(`${API_BASE}/trending`);
    url.searchParams.set('period', '24h');
    url.searchParams.set('limit', '100');

    const res = await fetchWithTimeout(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const templates = Array.isArray(data.templates) ? data.templates : [];
    const trendingMap = new Map();

    templates.forEach((item) => {
      const key = getTemplateKey({ repo: item.repo, id: item.template_id });
      trendingMap.set(key, typeof item.installs === 'number' ? item.installs : 0);
    });

    return trendingMap;
  } catch {
    return new Map();
  }
}

export async function fetchAllStats(templates) {
  const results = new Map();
  templates.forEach((template) => {
    results.set(getTemplateKey(template), { ...EMPTY_STATS });
  });

  const installQueue = templates.filter((template) => supportsInstallStats(template));
  const usageQueue = templates.filter((template) => supportsUsageStats(template));
  const trendingPromise = fetchTrending();

  async function installWorker() {
    while (installQueue.length > 0) {
      const template = installQueue.shift();
      if (!template) break;
      const stats = await fetchStats(template);
      results.set(getTemplateKey(template), { ...results.get(getTemplateKey(template)), ...stats });
    }
  }

  async function usageWorker() {
    while (usageQueue.length > 0) {
      const template = usageQueue.shift();
      if (!template) break;
      const stats = await fetchUsageStats(template);
      results.set(getTemplateKey(template), { ...results.get(getTemplateKey(template)), ...stats });
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, templates.length) },
    () => installWorker()
  );
  const usageWorkers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, templates.length) },
    () => usageWorker()
  );

  await Promise.all([...workers, ...usageWorkers]);

  const trendingMap = await trendingPromise;
  results.forEach((stats, key) => {
    if (trendingMap.has(key)) {
      stats.trending = trendingMap.get(key);
    }
  });

  return results;
}
