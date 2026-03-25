// js/app.js — UI controller for BananaHub

import { loadCatalog, getTemplates, filterTemplates, sortTemplates, searchTemplates } from './catalog.js';
import { fetchAllStats } from './api.js';

// ===== State =====
let allTemplates = [];
let statsMap = new Map();
let currentFilters = { profile: 'all', difficulty: 'all' };
let currentSort = 'all-time';
let currentSearch = '';
let searchTimer = null;

// ===== DOM refs =====
const grid = document.getElementById('card-grid');
const searchInput = document.getElementById('search-input');
const templateCount = document.getElementById('template-count');
const modalOverlay = document.getElementById('modal-overlay');
const modal = document.getElementById('modal');

// ===== Init =====
async function init() {
  // Restore state from hash
  readHash();

  // Load catalog
  try {
    await loadCatalog();
    allTemplates = getTemplates();
    templateCount.textContent = allTemplates.length;
  } catch (err) {
    console.error('Failed to load catalog:', err);
    grid.innerHTML = '<div class="card-empty"><p>Failed to load templates</p><p>Please try refreshing the page.</p></div>';
    return;
  }

  // Initial render
  render();

  // Restore UI state from hash
  syncUIFromState();

  // Async: fetch stats from API (graceful fallback)
  loadStats();

  // Bind events
  bindEvents();
}

// ===== Hash Routing =====
function readHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.has('profile')) currentFilters.profile = params.get('profile');
  if (params.has('difficulty')) currentFilters.difficulty = params.get('difficulty');
  if (params.has('sort')) currentSort = params.get('sort');
  if (params.has('q')) {
    currentSearch = params.get('q');
    searchInput.value = currentSearch;
  }
}

function writeHash() {
  const params = new URLSearchParams();
  if (currentFilters.profile !== 'all') params.set('profile', currentFilters.profile);
  if (currentFilters.difficulty !== 'all') params.set('difficulty', currentFilters.difficulty);
  if (currentSort !== 'all-time') params.set('sort', currentSort);
  if (currentSearch) params.set('q', currentSearch);
  const hash = params.toString();
  window.location.hash = hash || '';
}

function syncUIFromState() {
  // Profile pills
  document.querySelectorAll('[data-profile]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === currentFilters.profile);
  });
  // Difficulty pills
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty === currentFilters.difficulty);
  });
  // Sort tabs
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === currentSort);
  });
}

// ===== Render =====
function render() {
  let templates = [...allTemplates];
  templates = searchTemplates(templates, currentSearch);
  templates = filterTemplates(templates, currentFilters);
  templates = sortTemplates(templates, currentSort, statsMap);

  if (templates.length === 0) {
    grid.innerHTML = '<div class="card-empty"><p>No templates found</p><p>Try adjusting your search or filters.</p></div>';
    return;
  }

  grid.innerHTML = templates.map(t => renderCard(t)).join('');

  // Lazy load images
  observeImages();
}

function renderCard(t) {
  const stats = statsMap.get(t.id);
  const installs = stats ? stats.installs : '--';
  const profileColors = {
    photo: 'photo', sticker: 'sticker', product: 'product',
    diagram: 'diagram', minimal: 'minimal'
  };
  const profileClass = profileColors[t.profile] || '';
  const tagsHtml = (t.tags || []).slice(0, 4).map(tag => `<span class="tag">${escHtml(tag)}</span>`).join('');

  return `
    <article class="template-card" data-id="${escAttr(t.id)}">
      <div class="card-image-wrap">
        <div class="card-image-placeholder">&#x1F34C;</div>
        <img data-src="${escAttr(t.sample_image)}" alt="${escAttr(t.title_en)}" loading="lazy">
        <span class="card-aspect-badge">${escHtml(t.aspect)}</span>
        ${t.official ? '<span class="card-official-badge">Official</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${escHtml(t.title_en)}</div>
        <div class="card-subtitle">${escHtml(t.title)}</div>
        <div class="card-badges">
          <span class="badge badge-profile ${profileClass}">${escHtml(t.profile)}</span>
          <span class="badge badge-difficulty">${escHtml(t.difficulty)}</span>
        </div>
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="card-footer">
        <span class="install-count" data-stat-id="${escAttr(t.id)}">&#x2193; ${installs}</span>
        <button class="copy-btn" data-cmd="${escAttr(t.install_cmd)}" title="Copy install command">
          $ ${escHtml(t.install_cmd)}
        </button>
      </div>
    </article>
  `;
}

// ===== Lazy Image Loading =====
let imageObserver = null;

function observeImages() {
  if (imageObserver) imageObserver.disconnect();

  const images = grid.querySelectorAll('img[data-src]');
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all
    images.forEach(img => loadImage(img));
    return;
  }

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(entry.target);
        imageObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => imageObserver.observe(img));
}

function loadImage(img) {
  const src = img.dataset.src;
  if (!src) return;
  img.src = src;
  img.onload = () => img.classList.add('loaded');
  img.onerror = () => {
    // Keep placeholder visible on error
    img.removeAttribute('data-src');
  };
}

// ===== Stats Loading =====
async function loadStats() {
  const ids = allTemplates.map(t => t.id);
  statsMap = await fetchAllStats(ids);
  patchStats();
}

function patchStats() {
  // Update install counts in rendered cards
  document.querySelectorAll('[data-stat-id]').forEach(el => {
    const id = el.dataset.statId;
    const stats = statsMap.get(id);
    if (stats) {
      el.innerHTML = `&#x2193; ${stats.installs}`;
    }
  });
}

// ===== Events =====
function bindEvents() {
  // Search (200ms debounce)
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = searchInput.value;
      writeHash();
      render();
    }, 200);
  });

  // Profile filter pills
  document.querySelectorAll('[data-profile]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.profile = btn.dataset.profile;
      document.querySelectorAll('[data-profile]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      writeHash();
      render();
    });
  });

  // Difficulty filter pills
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.difficulty = btn.dataset.difficulty;
      document.querySelectorAll('[data-difficulty]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      writeHash();
      render();
    });
  });

  // Sort tabs
  document.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSort = btn.dataset.sort;
      document.querySelectorAll('[data-sort]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      writeHash();
      render();
    });
  });

  // Card click -> detail modal
  grid.addEventListener('click', (e) => {
    // Handle copy button
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
      e.stopPropagation();
      copyToClipboard(copyBtn.dataset.cmd, copyBtn);
      return;
    }

    // Handle card click
    const card = e.target.closest('.template-card');
    if (card) {
      const id = card.dataset.id;
      const template = allTemplates.find(t => t.id === id);
      if (template) openModal(template);
    }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Modal copy button
  document.getElementById('modal-copy-btn').addEventListener('click', () => {
    const cmd = document.getElementById('modal-install-cmd').textContent;
    copyToClipboard(cmd, document.getElementById('modal-copy-btn'));
  });

  // Hash change
  window.addEventListener('hashchange', () => {
    readHash();
    syncUIFromState();
    render();
  });
}

// ===== Modal =====
function openModal(t) {
  document.getElementById('modal-image').src = t.sample_image;
  document.getElementById('modal-image').alt = t.title_en;
  document.getElementById('modal-title').textContent = t.title_en;
  document.getElementById('modal-subtitle').textContent = t.title;
  document.getElementById('modal-desc').textContent = t.description;
  document.getElementById('modal-author').textContent = t.author;
  document.getElementById('modal-version').textContent = t.version;
  document.getElementById('modal-aspect').textContent = t.aspect;
  document.getElementById('modal-updated').textContent = t.updated;
  document.getElementById('modal-install-cmd').textContent = t.install_cmd;

  // Badges
  const badgesHtml = `
    <span class="badge badge-profile ${t.profile}">${escHtml(t.profile)}</span>
    <span class="badge badge-difficulty">${escHtml(t.difficulty)}</span>
  `;
  document.getElementById('modal-badges').innerHTML = badgesHtml;

  // Tags
  const tagsHtml = (t.tags || []).map(tag => `<span class="tag">${escHtml(tag)}</span>`).join('');
  document.getElementById('modal-tags').innerHTML = tagsHtml;

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== Clipboard =====
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 1500);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  }
}

// ===== Helpers =====
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== Boot =====
init();
