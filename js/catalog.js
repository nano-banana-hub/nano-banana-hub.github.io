// js/catalog.js - Data layer for BananaHub

let catalog = null;

export async function loadCatalog() {
  if (catalog) return catalog;
  const res = await fetch('catalog.json');
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  catalog = await res.json();
  return catalog;
}

export function getTemplates() {
  return catalog ? catalog.templates : [];
}

export function filterTemplates(templates, filters) {
  return templates.filter((template) => {
    if (filters.source && filters.source !== 'all' && template.catalog_source !== filters.source) {
      return false;
    }
    if (filters.profile && filters.profile !== 'all' && template.profile !== filters.profile) {
      return false;
    }
    if (filters.difficulty && filters.difficulty !== 'all' && template.difficulty !== filters.difficulty) {
      return false;
    }
    return true;
  });
}

export function sortTemplates(templates, sortMode, statsMap) {
  const sorted = [...templates];

  const getStats = (template) => statsMap.get(`${template.repo || 'unknown'}::${template.id}`);
  const getTrending = (template) => {
    const value = getStats(template)?.trending;
    return typeof value === 'number' ? value : 0;
  };
  const getInstalls = (template) => {
    const value = getStats(template)?.installs;
    return typeof value === 'number' ? value : 0;
  };
  const getPinnedRank = (template) => (
    Number.isFinite(template.pinned_rank) ? template.pinned_rank : Number.POSITIVE_INFINITY
  );
  const getFeatured = (template) => Number(Boolean(template.featured));
  const getOfficial = (template) => Number(Boolean(template.official));
  const getTitle = (template) => template.title_en || template.title || template.id;

  sorted.sort((a, b) => {
    const pinnedDiff = getPinnedRank(a) - getPinnedRank(b);
    if (pinnedDiff !== 0) {
      return pinnedDiff;
    }

    const featuredDiff = getFeatured(b) - getFeatured(a);
    if (featuredDiff !== 0) {
      return featuredDiff;
    }

    if (sortMode === 'trending') {
      const trendingDiff = getTrending(b) - getTrending(a);
      if (trendingDiff !== 0) {
        return trendingDiff;
      }
    } else {
      const installsDiff = getInstalls(b) - getInstalls(a);
      if (installsDiff !== 0) {
        return installsDiff;
      }
    }

    const officialDiff = getOfficial(b) - getOfficial(a);
    if (officialDiff !== 0) {
      return officialDiff;
    }

    return getTitle(a).localeCompare(getTitle(b), 'en');
  });

  return sorted;
}

export function searchTemplates(templates, query) {
  if (!query || !query.trim()) return templates;

  const terms = query.trim().toLowerCase().split(/\s+/);

  return templates.filter((template) => {
    const searchable = [
      template.id,
      template.title,
      template.title_en,
      template.description,
      template.author,
      template.profile,
      template.catalog_source,
      template.difficulty,
      ...(template.tags || [])
    ].join(' ').toLowerCase();

    return terms.every((term) => searchable.includes(term));
  });
}
