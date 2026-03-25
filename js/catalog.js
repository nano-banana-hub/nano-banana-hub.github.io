// js/catalog.js — Data layer for BananaHub

let catalog = null;

/**
 * Load the template catalog
 * @returns {Promise<Object>} The catalog object
 */
export async function loadCatalog() {
  if (catalog) return catalog;
  const res = await fetch('catalog.json');
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  catalog = await res.json();
  return catalog;
}

/**
 * Get all templates
 * @returns {Array}
 */
export function getTemplates() {
  return catalog ? catalog.templates : [];
}

/**
 * Filter templates by profile and difficulty
 * @param {Array} templates
 * @param {Object} filters - { profile: string, difficulty: string }
 * @returns {Array}
 */
export function filterTemplates(templates, filters) {
  return templates.filter(t => {
    if (filters.profile && filters.profile !== 'all') {
      if (t.profile !== filters.profile) return false;
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      if (t.difficulty !== filters.difficulty) return false;
    }
    return true;
  });
}

/**
 * Sort templates by install count or trending
 * @param {Array} templates
 * @param {string} sortMode - 'all-time' or 'trending'
 * @param {Map} statsMap - Map of templateId -> stats object
 * @returns {Array}
 */
export function sortTemplates(templates, sortMode, statsMap) {
  const sorted = [...templates];
  if (sortMode === 'trending' && statsMap) {
    sorted.sort((a, b) => {
      const sa = statsMap.get(a.id);
      const sb = statsMap.get(b.id);
      const ta = (sa && typeof sa.trending === 'number') ? sa.trending : 0;
      const tb = (sb && typeof sb.trending === 'number') ? sb.trending : 0;
      return tb - ta;
    });
  } else if (statsMap) {
    sorted.sort((a, b) => {
      const sa = statsMap.get(a.id);
      const sb = statsMap.get(b.id);
      const ia = (sa && typeof sa.installs === 'number') ? sa.installs : 0;
      const ib = (sb && typeof sb.installs === 'number') ? sb.installs : 0;
      return ib - ia;
    });
  }
  return sorted;
}

/**
 * Bilingual search across templates
 * @param {Array} templates
 * @param {string} query
 * @returns {Array}
 */
export function searchTemplates(templates, query) {
  if (!query || !query.trim()) return templates;

  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/);

  return templates.filter(t => {
    const searchable = [
      t.id,
      t.title,
      t.title_en,
      t.description,
      t.author,
      t.profile,
      t.difficulty,
      ...(t.tags || [])
    ].join(' ').toLowerCase();

    return terms.every(term => searchable.includes(term));
  });
}
