import { loadCatalog, getTemplates, filterTemplates, sortTemplates, searchTemplates } from './catalog.js';
import { fetchAllStats, getTemplateKey } from './api.js';
import {
  getCurrentLanguage,
  getCurrentLocale,
  initI18n,
  subscribeLanguageChange,
  syncLanguageFromLocation,
  t,
  translateEnum
} from './i18n.js';

const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_WEB = 'https://github.com';
const DEFAULT_FILTERS = {
  source: 'all',
  profile: 'all',
  difficulty: 'all'
};

const DEFAULT_SORT = 'all-time';
const SAMPLE_SWIPE_THRESHOLD = 48;
const EMPTY_STATS = {
  installs: '--',
  trending: 0
};

let catalog = null;
let allTemplates = [];
let visibleTemplates = [];
let statsMap = new Map();
let currentFilters = { ...DEFAULT_FILTERS };
let currentSort = DEFAULT_SORT;
let currentSearch = '';
let searchTimer = null;
let activeTemplate = null;
let activeSampleIndex = 0;
let lastFocusTarget = null;
let didCatalogLoadFail = false;
let isHandlingLocationSync = false;
const previewRecoveryCache = new Map();

const dom = {
  siteHeader: document.querySelector('.site-header'),
  grid: document.getElementById('card-grid'),
  searchInput: document.getElementById('search-input'),
  templateCount: document.getElementById('template-count'),
  profileCount: document.getElementById('profile-count'),
  catalogGenerated: document.getElementById('catalog-generated'),
  resultCount: document.getElementById('result-count'),
  curatedCount: document.getElementById('curated-count'),
  discoveredCount: document.getElementById('discovered-count'),
  resultsSummary: document.getElementById('results-summary'),
  catalogHint: document.getElementById('catalog-hint'),
  clearFilters: document.getElementById('clear-filters'),
  modalOverlay: document.getElementById('modal-overlay'),
  modalClose: document.getElementById('modal-close'),
  modalSampleControls: document.getElementById('modal-sample-controls'),
  modalPrevSample: document.getElementById('modal-prev-sample'),
  modalNextSample: document.getElementById('modal-next-sample'),
  modalSampleCount: document.getElementById('modal-sample-count'),
  modalImageButton: document.getElementById('modal-image-button'),
  modalImage: document.getElementById('modal-image'),
  modalImageHint: document.getElementById('modal-image-hint'),
  modalActions: document.getElementById('modal-actions'),
  modalViewImageBtn: document.getElementById('modal-view-image-btn'),
  modalOpenOriginalLink: document.getElementById('modal-open-original-link'),
  modalTemplateSourceLink: document.getElementById('modal-template-source-link'),
  modalTitle: document.getElementById('modal-title'),
  modalSubtitle: document.getElementById('modal-subtitle'),
  modalDesc: document.getElementById('modal-desc'),
  modalBadges: document.getElementById('modal-badges'),
  modalTags: document.getElementById('modal-tags'),
  modalAuthor: document.getElementById('modal-author'),
  modalVersion: document.getElementById('modal-version'),
  modalAspect: document.getElementById('modal-aspect'),
  modalUpdated: document.getElementById('modal-updated'),
  modalInstalls: document.getElementById('modal-installs'),
  modalTrending: document.getElementById('modal-trending'),
  modalInstallCmd: document.getElementById('modal-install-cmd'),
  modalCopyBtn: document.getElementById('modal-copy-btn'),
  lightboxOverlay: document.getElementById('lightbox-overlay'),
  lightboxSampleControls: document.getElementById('lightbox-sample-controls'),
  lightboxPrevSample: document.getElementById('lightbox-prev-sample'),
  lightboxNextSample: document.getElementById('lightbox-next-sample'),
  lightboxSampleCount: document.getElementById('lightbox-sample-count'),
  lightboxStage: document.getElementById('lightbox-stage'),
  lightboxImage: document.getElementById('lightbox-image'),
  lightboxOpenOriginalLink: document.getElementById('lightbox-open-original-link'),
  lightboxClose: document.getElementById('lightbox-close'),
  structuredData: document.getElementById('structured-data')
};

let imageObserver = null;

async function init() {
  initI18n({ page: 'index' });
  syncStickyOffsets();
  bindEvents();
  subscribeLanguageChange(handleLanguageChange);
  readUrlState();
  syncUIFromState();

  try {
    catalog = await loadCatalog();
    allTemplates = getTemplates();
    didCatalogLoadFail = false;
  } catch (error) {
    console.error('Failed to load catalog:', error);
    didCatalogLoadFail = true;
    renderLoadError();
    return;
  }

  hydrateCatalogMeta();
  updateStructuredData();
  render();
  loadStats();
}

function handleLanguageChange() {
  syncStickyOffsets();

  if (isHandlingLocationSync) {
    return;
  }

  if (catalog) {
    hydrateCatalogMeta();
    render();

    if (dom.lightboxOverlay.classList.contains('open') && activeTemplate) {
      openLightbox(activeTemplate);
    }
    return;
  }

  if (didCatalogLoadFail) {
    renderLoadError();
  }
}

function bindEvents() {
  dom.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = dom.searchInput.value.trim();
      writeUrlState();
      render();
    }, 180);
  });

  document.querySelectorAll('[data-profile]').forEach((button) => {
    button.addEventListener('click', () => {
      currentFilters.profile = button.dataset.profile || DEFAULT_FILTERS.profile;
      writeUrlState();
      syncUIFromState();
      render();
    });
  });

  document.querySelectorAll('[data-source]').forEach((button) => {
    button.addEventListener('click', () => {
      currentFilters.source = button.dataset.source || DEFAULT_FILTERS.source;
      writeUrlState();
      syncUIFromState();
      render();
    });
  });

  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    button.addEventListener('click', () => {
      currentFilters.difficulty = button.dataset.difficulty || DEFAULT_FILTERS.difficulty;
      writeUrlState();
      syncUIFromState();
      render();
    });
  });

  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      currentSort = button.dataset.sort || DEFAULT_SORT;
      writeUrlState();
      syncUIFromState();
      render();
    });
  });

  dom.clearFilters.addEventListener('click', () => {
    resetState();
    dom.searchInput.value = '';
    writeUrlState();
    syncUIFromState();
    render();
  });

  dom.grid.addEventListener('click', (event) => {
    const copyButton = event.target.closest('.copy-btn');
    if (copyButton) {
      event.stopPropagation();
      copyToClipboard(copyButton.dataset.cmd || '', copyButton);
      return;
    }

    if (event.target.closest('a')) {
      return;
    }

    const card = event.target.closest('.template-card');
    if (!card) {
      return;
    }

    openTemplateFromCard(card);
  });

  dom.grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const card = event.target.closest('.template-card');
    if (!card || event.target !== card) {
      return;
    }

    event.preventDefault();
    openTemplateFromCard(card);
  });

  dom.modalClose.addEventListener('click', closeModal);
  dom.modalOverlay.addEventListener('click', (event) => {
    if (event.target === dom.modalOverlay) {
      closeModal();
    }
  });

  dom.modalImageButton.addEventListener('click', () => {
    if (getActiveSample(activeTemplate)?.image) {
      openLightbox(activeTemplate);
    }
  });

  dom.modalViewImageBtn.addEventListener('click', () => {
    if (getActiveSample(activeTemplate)?.image) {
      openLightbox(activeTemplate);
    }
  });

  dom.modalPrevSample.addEventListener('click', () => navigateActiveSample(-1));
  dom.modalNextSample.addEventListener('click', () => navigateActiveSample(1));
  bindSampleSwipe(dom.modalImageButton);

  dom.modalCopyBtn.addEventListener('click', () => {
    copyToClipboard(dom.modalInstallCmd.textContent || '', dom.modalCopyBtn);
  });

  dom.lightboxClose.addEventListener('click', closeLightbox);
  dom.lightboxPrevSample.addEventListener('click', () => navigateActiveSample(-1));
  dom.lightboxNextSample.addEventListener('click', () => navigateActiveSample(1));
  bindSampleSwipe(dom.lightboxStage);
  dom.lightboxOverlay.addEventListener('click', (event) => {
    if (event.target === dom.lightboxOverlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      && (dom.modalOverlay.classList.contains('open') || dom.lightboxOverlay.classList.contains('open'))
    ) {
      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      if (navigateActiveSample(delta)) {
        event.preventDefault();
      }
      return;
    }

    if (event.key !== 'Escape') {
      return;
    }

    if (dom.lightboxOverlay.classList.contains('open')) {
      closeLightbox();
      return;
    }

    if (dom.modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  window.addEventListener('popstate', handleUrlNavigation);
  window.addEventListener('hashchange', handleUrlNavigation);
  window.addEventListener('resize', syncStickyOffsets);
}

function handleUrlNavigation() {
  isHandlingLocationSync = true;
  syncLanguageFromLocation('index');
  isHandlingLocationSync = false;
  readUrlState();
  syncUIFromState();
  syncStickyOffsets();

  if (catalog) {
    hydrateCatalogMeta();
    render();
    return;
  }

  if (didCatalogLoadFail) {
    renderLoadError();
  }
}

function syncStickyOffsets() {
  const headerHeight = dom.siteHeader
    ? Math.ceil(dom.siteHeader.getBoundingClientRect().height)
    : 86;
  document.documentElement.style.setProperty('--sticky-header-offset', `${headerHeight + 8}px`);
}

function renderLoadError() {
  const zero = formatCount(0);
  const unavailable = t('common.value.unavailable');

  dom.templateCount.textContent = zero;
  dom.profileCount.textContent = zero;
  dom.catalogGenerated.textContent = unavailable;
  dom.catalogGenerated.title = unavailable;
  dom.resultCount.textContent = zero;
  dom.curatedCount.textContent = zero;
  dom.discoveredCount.textContent = zero;
  dom.resultsSummary.textContent = t('common.results.loadFailedSummary');
  dom.catalogHint.textContent = t('common.results.loadFailedHint');
  dom.grid.innerHTML = [
    '<div class="card-empty">',
    `<p>${escHtml(t('common.empty.loadFailedTitle'))}</p>`,
    `<p>${escHtml(t('common.empty.loadFailedBody'))}</p>`,
    '</div>'
  ].join('');
  dom.clearFilters.hidden = true;
}

function resetState() {
  currentFilters = { ...DEFAULT_FILTERS };
  currentSort = DEFAULT_SORT;
  currentSearch = '';
}

function readUrlState() {
  resetState();

  const params = getStateParamsFromUrl();
  const source = params.get('source');
  const profile = params.get('profile');
  const difficulty = params.get('difficulty');
  const sort = params.get('sort');
  const query = params.get('q');

  if (isAllowedValue('source', source)) {
    currentFilters.source = source;
  }

  if (isAllowedValue('profile', profile)) {
    currentFilters.profile = profile;
  }

  if (isAllowedValue('difficulty', difficulty)) {
    currentFilters.difficulty = difficulty;
  }

  if (isAllowedValue('sort', sort)) {
    currentSort = sort;
  }

  currentSearch = query ? query.trim() : '';
  dom.searchInput.value = currentSearch;
}

function getStateParamsFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  if ([...searchParams.keys()].length > 0) {
    return searchParams;
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (hash.includes('=')) {
    return new URLSearchParams(hash);
  }

  return new URLSearchParams();
}

function writeUrlState() {
  const params = new URLSearchParams();
  const language = getCurrentLanguage();

  if (language !== 'en') {
    params.set('lang', language);
  }

  if (currentFilters.source !== DEFAULT_FILTERS.source) {
    params.set('source', currentFilters.source);
  }

  if (currentFilters.profile !== DEFAULT_FILTERS.profile) {
    params.set('profile', currentFilters.profile);
  }

  if (currentFilters.difficulty !== DEFAULT_FILTERS.difficulty) {
    params.set('difficulty', currentFilters.difficulty);
  }

  if (currentSort !== DEFAULT_SORT) {
    params.set('sort', currentSort);
  }

  if (currentSearch) {
    params.set('q', currentSearch);
  }

  const url = new URL(window.location.href);
  url.search = params.toString();

  if (url.hash.includes('=')) {
    url.hash = '';
  }

  window.history.replaceState(null, '', url);
}

function isAllowedValue(datasetKey, value) {
  if (!value) {
    return false;
  }

  return Array.from(document.querySelectorAll(`[data-${datasetKey}]`)).some(
    (element) => element.dataset[datasetKey] === value
  );
}

function syncUIFromState() {
  document.querySelectorAll('[data-source]').forEach((button) => {
    button.classList.toggle('active', button.dataset.source === currentFilters.source);
  });

  document.querySelectorAll('[data-profile]').forEach((button) => {
    button.classList.toggle('active', button.dataset.profile === currentFilters.profile);
  });

  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    button.classList.toggle('active', button.dataset.difficulty === currentFilters.difficulty);
  });

  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.classList.toggle('active', button.dataset.sort === currentSort);
  });
}

function hydrateCatalogMeta() {
  const summary = catalog?.summary || {};
  const totalTemplates = summary.template_count || allTemplates.length;
  const totalProfiles = summary.profile_count || new Set(allTemplates.map((template) => template.profile)).size;
  const generatedAt = catalog?.generated || '';

  dom.templateCount.textContent = formatCount(totalTemplates);
  dom.profileCount.textContent = formatCount(totalProfiles);
  dom.catalogGenerated.textContent = formatDate(generatedAt);
  dom.catalogGenerated.title = generatedAt || t('common.value.unknown');
}

function render() {
  let templates = [...allTemplates];
  templates = searchTemplates(templates, currentSearch);
  templates = filterTemplates(templates, currentFilters);
  templates = sortTemplates(templates, currentSort, statsMap);
  visibleTemplates = templates;

  updateResultsPanel();
  updateStructuredData();

  if (templates.length === 0) {
    dom.grid.innerHTML = [
      '<div class="card-empty">',
      `<p>${escHtml(t('common.empty.noMatchTitle'))}</p>`,
      `<p>${escHtml(t('common.empty.noMatchBody'))}</p>`,
      '</div>'
    ].join('');
    return;
  }

  dom.grid.innerHTML = templates.map((template) => renderCard(template)).join('');
  observeImages();

  if (activeTemplate) {
    const latestTemplate = findTemplate(activeTemplate.id, activeTemplate.repo);
    if (latestTemplate) {
      populateModal(latestTemplate);
    }
  }
}

function updateResultsPanel() {
  const visibleProfileCount = new Set(visibleTemplates.map((template) => template.profile)).size;
  const visibleCuratedCount = visibleTemplates.filter((template) => template.catalog_source === 'curated').length;
  const visibleDiscoveredCount = visibleTemplates.filter((template) => template.catalog_source === 'discovered').length;
  const activeDetails = [];

  if (currentSearch) {
    activeDetails.push(t('common.results.query', { value: currentSearch }));
  }

  if (currentFilters.source !== DEFAULT_FILTERS.source) {
    activeDetails.push(
      t('common.results.source', {
        value: translateEnum('source', currentFilters.source, currentFilters.source)
      })
    );
  }

  if (currentFilters.profile !== DEFAULT_FILTERS.profile) {
    activeDetails.push(
      t('common.results.profile', {
        value: translateEnum('profile', currentFilters.profile, currentFilters.profile)
      })
    );
  }

  if (currentFilters.difficulty !== DEFAULT_FILTERS.difficulty) {
    activeDetails.push(
      t('common.results.difficulty', {
        value: translateEnum('difficulty', currentFilters.difficulty, currentFilters.difficulty)
      })
    );
  }

  dom.resultCount.textContent = formatCount(visibleTemplates.length);
  dom.curatedCount.textContent = formatCount(visibleCuratedCount);
  dom.discoveredCount.textContent = formatCount(visibleDiscoveredCount);

  if (visibleTemplates.length > 0) {
    const summaryBits = [getTemplateCountLabel(visibleTemplates.length)];

    if (visibleProfileCount > 0) {
      summaryBits.push(getProfileCountLabel(visibleProfileCount));
    }

    summaryBits.push(
      currentSort === 'trending'
        ? t('common.results.sortedByTrending')
        : t('common.results.sortedByInstalls')
    );

    if (activeDetails.length > 0) {
      summaryBits.push(
        t('common.results.filteredBy', {
          details: joinLocalizedList(activeDetails)
        })
      );
    }

    dom.resultsSummary.textContent = summaryBits.join(' · ');
  } else {
    dom.resultsSummary.textContent = t('common.results.noMatch');
  }

  if (hasActiveState()) {
    dom.catalogHint.textContent = t('common.results.shareableHint');
  } else {
    dom.catalogHint.textContent = t('common.results.defaultHint', {
      date: formatDate(catalog?.generated)
    });
  }

  dom.clearFilters.hidden = !hasActiveState();
}

function hasActiveState() {
  return Boolean(
    currentSearch
    || currentFilters.source !== DEFAULT_FILTERS.source
    || currentFilters.profile !== DEFAULT_FILTERS.profile
    || currentFilters.difficulty !== DEFAULT_FILTERS.difficulty
    || currentSort !== DEFAULT_SORT
  );
}

function renderCard(template) {
  const stats = getTemplateStats(template);
  const key = getTemplateKey(template);
  const title = getLocalizedTemplateTitle(template);
  const subtitle = getLocalizedTemplateSubtitle(template, template.repo);
  const samples = getTemplateSamples(template);
  const primarySample = samples[0] || null;
  const tagsHtml = (template.tags || [])
    .slice(0, 3)
    .map((tag) => `<span class="tag">${escHtml(tag)}</span>`)
    .join('');
  const hasSampleImage = Boolean(primarySample?.image);
  const previewLabel = hasSampleImage ? t('common.preview.loading') : t('common.preview.unavailable');
  const sourceUrl = template.template_url || template.repo_url || '#';
  const sourceValue = template.catalog_source || 'curated';
  const typeValue = template.type || 'prompt';
  const profileValue = template.profile || 'general';
  const difficultyValue = template.difficulty || 'beginner';
  const aspectValue = template.aspect || t('common.value.na');
  const installDisplay = getInstallDisplay(stats);
  const trendingDisplay = getTrendingDisplay(stats);
  const featuredLabel = template.featured_label?.trim() || t('common.badge.featured');
  const officialLabel = template.official ? t('common.badge.official') : t('common.badge.community');

  return `
    <article
      class="template-card"
      data-id="${escAttr(template.id)}"
      data-repo="${escAttr(template.repo)}"
      tabindex="0"
      role="button"
      aria-label="${escAttr(t('common.aria.openDetails', { title }))}"
    >
      <div class="card-image-wrap${hasSampleImage ? '' : ' is-error'}${prefersContainedPreview(template.aspect) ? ' prefers-contain' : ''}">
        <div class="card-image-placeholder" aria-hidden="true">
          <span class="card-image-placeholder-label">${escHtml(previewLabel)}</span>
        </div>
        ${hasSampleImage ? `<img data-src="${escAttr(primarySample.image)}" alt="${escAttr(title)}" loading="lazy">` : ''}
        <div class="card-top-badges">
          <div class="card-top-badges-left">
            ${template.pinned ? `<span class="card-flag-badge">${escHtml(t('common.badge.pinned'))}</span>` : ''}
            ${template.featured ? `<span class="card-flag-badge">${escHtml(featuredLabel)}</span>` : ''}
          </div>
          <div class="card-top-badges-right">
            <span class="card-type-badge ${escAttr(typeValue)}">${escHtml(translateEnum('type', typeValue, typeValue))}</span>
            <span class="card-profile-badge">${escHtml(translateEnum('profile', profileValue, profileValue))}</span>
          </div>
        </div>
        <span class="card-aspect-badge">${escHtml(aspectValue)}</span>
        <span class="card-corner-badge">${escHtml(officialLabel)}</span>
      </div>

      <div class="card-body">
        <div class="card-head">
          <div class="card-title-stack">
            <p class="card-eyebrow">${escHtml(template.id)}</p>
            <div class="card-title">${escHtml(title)}</div>
            <div class="card-subtitle">${escHtml(subtitle || template.repo)}</div>
          </div>
        </div>

        <div class="card-tags">
          ${tagsHtml || `<span class="tag">${escHtml(t('common.template.noTags'))}</span>`}
        </div>

        <div class="card-meta-inline">
          <span>${escHtml(translateEnum('source', sourceValue, sourceValue))}</span>
          <span>${escHtml(translateEnum('difficulty', difficultyValue, difficultyValue))}</span>
          <span>${escHtml(aspectValue)}</span>
          <span data-stat-key="${escAttr(key)}" data-stat-type="trending">${escHtml(t('common.card.installs24h', { count: trendingDisplay }))}</span>
        </div>

        <div class="card-actions">
          <span class="card-action-stat" aria-label="${escAttr(t('common.card.installCountAria', { count: installDisplay }))}">
            <span class="card-action-stat-value" data-stat-key="${escAttr(key)}" data-stat-type="installs">${escHtml(installDisplay)}</span>
            <small>${escHtml(t('common.card.installs'))}</small>
          </span>
          <button
            class="copy-btn card-action-icon"
            data-cmd="${escAttr(template.install_cmd)}"
            type="button"
            aria-label="${escAttr(t('common.action.copyInstall'))}"
            title="${escAttr(t('common.action.copyInstall'))}"
          >
            ${renderCardActionIcon('copy')}
            <span class="visually-hidden">${escHtml(t('common.action.copyInstall'))}</span>
          </button>
          <a
            class="card-source-link card-action-icon"
            href="${escAttr(sourceUrl)}"
            target="_blank"
            rel="noopener"
            aria-label="${escAttr(t('common.action.source'))}"
            title="${escAttr(t('common.action.source'))}"
          >
            ${renderCardActionIcon('source')}
            <span class="visually-hidden">${escHtml(t('common.action.source'))}</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderBadge(className, label) {
  return `<span class="${className}">${escHtml(label)}</span>`;
}

function renderCardActionIcon(kind) {
  if (kind === 'copy') {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="10" height="10" rx="2"></rect>
        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 5h5v5"></path>
      <path d="M10 14 19 5"></path>
      <path d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3"></path>
    </svg>
  `;
}

function observeImages() {
  if (imageObserver) {
    imageObserver.disconnect();
  }

  const images = dom.grid.querySelectorAll('img[data-src]');
  if (!('IntersectionObserver' in window)) {
    images.forEach((image) => loadImage(image));
    return;
  }

  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      loadImage(entry.target);
      imageObserver.unobserve(entry.target);
    });
  }, { rootMargin: '200px' });

  images.forEach((image) => imageObserver.observe(image));
}

function loadImage(image) {
  const src = image.dataset.src;
  if (!src) {
    return;
  }

  const wrap = image.closest('.card-image-wrap');
  image.src = src;

  image.onload = () => {
    image.classList.add('loaded');
    image.removeAttribute('data-src');
    if (wrap) {
      wrap.classList.add('is-loaded');
      wrap.classList.remove('is-error');
    }
  };

  image.onerror = async () => {
    image.removeAttribute('data-src');
    const card = image.closest('.template-card');
    const template = card ? findTemplate(card.dataset.id, card.dataset.repo) : null;
    const recovered = template ? await recoverTemplatePreview(template) : null;

    if (recovered?.sampleImage && recovered.sampleImage !== src) {
      image.dataset.src = recovered.sampleImage;
      loadImage(image);

      if (activeTemplate && isSameTemplate(activeTemplate, template)) {
        populateModal(template);
      }
      return;
    }

    markPreviewUnavailable(wrap);
  };
}

async function loadStats() {
  statsMap = await fetchAllStats(allTemplates);
  render();

  if (activeTemplate) {
    const latestTemplate = findTemplate(activeTemplate.id, activeTemplate.repo);
    if (latestTemplate) {
      populateModal(latestTemplate);
    }
  }
}

function openTemplateFromCard(card) {
  const template = findTemplate(card.dataset.id, card.dataset.repo);
  if (!template) {
    return;
  }

  openModal(template, card);
}

function findTemplate(id, repo) {
  return allTemplates.find((template) => template.id === id && template.repo === repo) || null;
}

function openModal(template, triggerElement) {
  activeTemplate = template;
  activeSampleIndex = 0;
  lastFocusTarget = triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;
  populateModal(template);
  closeLightbox();
  dom.modalOverlay.classList.add('open');
  dom.modalOverlay.setAttribute('aria-hidden', 'false');
  updateBodyScrollLock();
  dom.modalClose.focus();

  void hydrateTemplateSamples(template).then(() => {
    if (activeTemplate && isSameTemplate(activeTemplate, template)) {
      populateModal(template);
      if (dom.lightboxOverlay.classList.contains('open')) {
        openLightbox(template);
      }
    }
  });
}

function populateModal(template) {
  const stats = getTemplateStats(template);
  const title = getLocalizedTemplateTitle(template);
  const subtitle = getLocalizedTemplateSubtitle(template, template.id);
  const templateUrl = getTemplateUrl(template);
  const samples = getTemplateSamples(template);
  const activeSample = getActiveSample(template);
  const originalImageUrl = getOriginalImageLink(activeSample, template);
  const hasSampleImage = Boolean(activeSample?.image);
  const featuredLabel = template.featured_label?.trim() || t('common.badge.featured');
  const typeValue = template.type || 'prompt';
  const profileValue = template.profile || 'general';
  const difficultyValue = template.difficulty || 'beginner';
  const sourceValue = template.catalog_source || 'curated';

  dom.modalTitle.textContent = title;
  dom.modalSubtitle.textContent = subtitle;
  dom.modalDesc.textContent = getLocalizedTemplateDescription(template);
  dom.modalAuthor.textContent = template.author || t('common.value.unknown');
  dom.modalVersion.textContent = template.version || t('common.value.unknown');
  dom.modalAspect.textContent = template.aspect || t('common.value.na');
  dom.modalUpdated.textContent = formatDate(template.updated || template.created);
  dom.modalInstalls.textContent = getInstallDisplay(stats);
  dom.modalTrending.textContent = getTrendingDisplay(stats);
  dom.modalInstallCmd.textContent = template.install_cmd || '';

  dom.modalBadges.innerHTML = [
    ...(template.pinned ? [renderBadge('badge badge-flag', t('common.badge.pinned'))] : []),
    ...(template.featured ? [renderBadge('badge badge-flag', featuredLabel)] : []),
    renderBadge(`badge badge-type ${escAttr(typeValue)}`, translateEnum('type', typeValue, typeValue)),
    renderBadge(`badge badge-profile ${escAttr(profileValue)}`, translateEnum('profile', profileValue, profileValue)),
    renderBadge('badge badge-difficulty', translateEnum('difficulty', difficultyValue, difficultyValue)),
    renderBadge('badge', template.official ? t('common.badge.official') : t('common.badge.community')),
    renderBadge('badge badge-source', translateEnum('source', sourceValue, sourceValue))
  ].join('');

  dom.modalTags.innerHTML = (template.tags || []).length > 0
    ? template.tags.map((tag) => `<span class="tag">${escHtml(tag)}</span>`).join('')
    : `<span class="tag">${escHtml(t('common.template.noTags'))}</span>`;

  if (hasSampleImage) {
    dom.modalImage.onerror = async () => {
      const attemptedSrc = dom.modalImage.currentSrc || dom.modalImage.src;
      const recovered = await recoverTemplatePreview(template);

      if (recovered?.sampleImage && recovered.sampleImage !== attemptedSrc) {
        populateModal(template);
        return;
      }

      markModalPreviewUnavailable(title);
    };
    dom.modalImage.src = activeSample.image;
    dom.modalImage.alt = activeSample.alt || title;
    dom.modalImageButton.setAttribute('aria-label', t('index.modal.viewFullImage'));
    dom.modalImageButton.classList.remove('is-disabled');
    dom.modalImageButton.disabled = false;
    dom.modalImageHint.textContent = t('common.preview.open');
  } else {
    markModalPreviewUnavailable(title);
  }

  updateSampleControls(samples);
  dom.modalViewImageBtn.hidden = !hasSampleImage;
  setLinkState(dom.modalOpenOriginalLink, originalImageUrl);
  setLinkState(dom.modalTemplateSourceLink, templateUrl);
  dom.modalActions.hidden = dom.modalViewImageBtn.hidden
    && dom.modalOpenOriginalLink.hidden
    && dom.modalTemplateSourceLink.hidden;
}

function closeModal() {
  closeLightbox();
  dom.modalOverlay.classList.remove('open');
  dom.modalOverlay.setAttribute('aria-hidden', 'true');
  activeTemplate = null;
  activeSampleIndex = 0;
  updateBodyScrollLock();

  if (lastFocusTarget instanceof HTMLElement) {
    lastFocusTarget.focus();
  }
}

function openLightbox(template) {
  const samples = getTemplateSamples(template);
  const activeSample = getActiveSample(template);
  if (!activeSample?.image) {
    return;
  }

  dom.lightboxImage.src = activeSample.image;
  dom.lightboxImage.alt = activeSample.alt || getLocalizedTemplateTitle(template);
  setLinkState(dom.lightboxOpenOriginalLink, getOriginalImageLink(activeSample, template));
  updateSampleControls(samples);
  dom.lightboxOverlay.classList.add('open');
  dom.lightboxOverlay.setAttribute('aria-hidden', 'false');
  updateBodyScrollLock();
}

function closeLightbox() {
  dom.lightboxOverlay.classList.remove('open');
  dom.lightboxOverlay.setAttribute('aria-hidden', 'true');
  dom.lightboxImage.removeAttribute('src');
  dom.lightboxImage.alt = '';
  dom.lightboxOpenOriginalLink.hidden = true;
  dom.lightboxOpenOriginalLink.removeAttribute('href');
  dom.lightboxSampleControls.hidden = true;
  updateBodyScrollLock();
}

function updateBodyScrollLock() {
  const isOpen = dom.modalOverlay.classList.contains('open') || dom.lightboxOverlay.classList.contains('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function bindSampleSwipe(element) {
  if (!element) {
    return;
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let isTracking = false;

  element.addEventListener('touchstart', (event) => {
    if (!activeTemplate || event.touches.length !== 1) {
      isTracking = false;
      return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isTracking = true;
  }, { passive: true });

  element.addEventListener('touchend', (event) => {
    if (!isTracking || !activeTemplate || event.changedTouches.length !== 1) {
      isTracking = false;
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    isTracking = false;

    if (Math.abs(deltaX) < SAMPLE_SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (navigateActiveSample(deltaX > 0 ? -1 : 1)) {
      event.preventDefault();
    }
  });
}

function setLinkState(link, href) {
  if (href) {
    link.href = href;
    link.hidden = false;
    return;
  }

  link.hidden = true;
  link.removeAttribute('href');
}

function getTemplateUrl(template) {
  if (template.template_url) {
    return template.template_url;
  }

  if (!template.repo) {
    return '';
  }

  const templatePath = template.template_path || `references/templates/${template.id}`;
  return `https://github.com/${template.repo}/tree/main/${templatePath}`;
}

function getOriginalImageLink(sample, template) {
  if (sample?.page_url) {
    return sample.page_url;
  }

  if (sample?.image) {
    return sample.image;
  }

  return template?.sample_image_page_url || template?.sample_image || '';
}

function markPreviewUnavailable(wrap) {
  if (!wrap) {
    return;
  }

  wrap.classList.remove('is-loaded');
  wrap.classList.add('is-error');

  const label = wrap.querySelector('.card-image-placeholder-label');
  if (label) {
    label.textContent = t('common.preview.unavailable');
  }
}

function markModalPreviewUnavailable(title) {
  dom.modalImage.onerror = null;
  dom.modalImage.removeAttribute('src');
  dom.modalImage.alt = t('common.aria.previewUnavailable', { title });
  dom.modalImageButton.setAttribute('aria-label', t('common.aria.previewUnavailable', { title }));
  dom.modalImageButton.classList.add('is-disabled');
  dom.modalImageButton.disabled = true;
  dom.modalImageHint.textContent = t('common.preview.unavailable');
  dom.modalSampleControls.hidden = true;
  dom.modalViewImageBtn.hidden = true;
  dom.modalOpenOriginalLink.hidden = true;
}

async function recoverTemplatePreview(template) {
  if (!template?.repo || !template?.branch) {
    return null;
  }

  const cacheKey = `${template.repo}::${template.branch}::${template.template_path || '.'}`;
  if (previewRecoveryCache.has(cacheKey)) {
    return previewRecoveryCache.get(cacheKey);
  }

  const task = (async () => {
    const manifestPath = joinRepoPath(template.template_path, 'template.md');
    const response = await fetch(`${GITHUB_RAW}/${template.repo}/${template.branch}/${manifestPath}`);
    if (!response.ok) {
      return null;
    }

    const frontmatter = parseFrontmatter(await response.text());
    const samples = normalizeTemplateSamples(frontmatter?.samples, template);
    if (samples.length === 0) {
      return null;
    }

    template.samples = samples;
    template.sample_image = samples[0].image || '';
    template.sample_image_page_url = samples[0].page_url || samples[0].image || '';
    return { samples, sampleImage: template.sample_image, sampleImagePageUrl: template.sample_image_page_url };
  })().catch(() => null);

  previewRecoveryCache.set(cacheKey, task);
  return task;
}

function parseFrontmatter(content) {
  const match = String(content || '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return null;
  }

  const result = {};
  const lines = match[1].split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || line.trim().startsWith('#')) {
      index += 1;
      continue;
    }

    const keyMatch = line.match(/^(\w[\w_]*):\s*(.*)/);
    if (!keyMatch) {
      index += 1;
      continue;
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();
    if (rawValue === '') {
      const items = [];
      let cursor = index + 1;

      while (cursor < lines.length && /^  - /.test(lines[cursor])) {
        const firstLine = lines[cursor].replace(/^  - /, '').trim();
        const objectValue = {};
        let hasObjectFields = false;

        const firstField = firstLine.match(/^(\w[\w_]*):\s*(.*)/);
        if (firstField) {
          objectValue[firstField[1]] = stripQuotes(firstField[2].trim());
          hasObjectFields = true;
        } else if (firstLine) {
          items.push(stripQuotes(firstLine));
          cursor += 1;
          continue;
        }

        cursor += 1;
        while (cursor < lines.length && /^    \w/.test(lines[cursor])) {
          const nested = lines[cursor].match(/^    (\w[\w_]*):\s*(.*)/);
          if (nested) {
            objectValue[nested[1]] = stripQuotes(nested[2].trim());
            hasObjectFields = true;
          }
          cursor += 1;
        }

        items.push(hasObjectFields ? objectValue : stripQuotes(firstLine));
      }

      result[key] = items;
      index = cursor;
      continue;
    }

    result[key] = stripQuotes(rawValue);
    index += 1;
  }

  return result;
}

function stripQuotes(value) {
  const text = String(value || '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function normalizePath(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function joinRepoPath(...parts) {
  return parts
    .map((part) => normalizePath(part))
    .filter(Boolean)
    .join('/');
}

function normalizeTemplateSamples(entries, template) {
  const rawEntries = Array.isArray(entries) ? entries : [];

  return rawEntries.map((entry) => {
    const sample = typeof entry === 'string' ? { file: entry } : (entry || {});
    const sampleFile = sample.file || '';
    const sampleImage = sample.image || (
      sampleFile && template?.repo && template?.branch
        ? `${GITHUB_RAW}/${template.repo}/${template.branch}/${joinRepoPath(template.template_path, sampleFile)}`
        : ''
    );
    const samplePageUrl = sample.page_url || (
      sampleFile && template?.repo && template?.branch
        ? `${GITHUB_WEB}/${template.repo}/blob/${template.branch}/${joinRepoPath(template.template_path, sampleFile)}`
        : ''
    );

    if (!sampleImage) {
      return null;
    }

    return {
      file: sampleFile,
      model: sample.model || '',
      prompt: sample.prompt || '',
      aspect: sample.aspect || template?.aspect || '',
      image: sampleImage,
      page_url: samplePageUrl || sampleImage,
      alt: sample.alt || getLocalizedTemplateTitle(template),
    };
  }).filter(Boolean);
}

function getTemplateSamples(template) {
  if (!template) {
    return [];
  }

  if (Array.isArray(template.samples) && template.samples.length > 0) {
    const normalized = normalizeTemplateSamples(template.samples, template);
    if (normalized.length > 0) {
      template.samples = normalized;
      template.sample_image = normalized[0].image;
      template.sample_image_page_url = normalized[0].page_url;
      return normalized;
    }
  }

  if (template.sample_image) {
    return [{
      image: template.sample_image,
      page_url: template.sample_image_page_url || template.sample_image,
      aspect: template.aspect || '',
      alt: getLocalizedTemplateTitle(template),
    }];
  }

  return [];
}

function getActiveSample(template) {
  const samples = getTemplateSamples(template);
  if (samples.length === 0) {
    return null;
  }

  if (activeSampleIndex >= samples.length || activeSampleIndex < 0) {
    activeSampleIndex = 0;
  }

  return samples[activeSampleIndex];
}

function updateSampleControls(samples) {
  const total = samples.length;
  const hasMultiple = total > 1;
  const countLabel = t('common.preview.sampleCount', {
    current: String(total === 0 ? 0 : activeSampleIndex + 1),
    total: String(total),
  });

  dom.modalSampleControls.hidden = !hasMultiple;
  dom.lightboxSampleControls.hidden = !hasMultiple;
  dom.modalPrevSample.disabled = !hasMultiple;
  dom.modalNextSample.disabled = !hasMultiple;
  dom.lightboxPrevSample.disabled = !hasMultiple;
  dom.lightboxNextSample.disabled = !hasMultiple;
  dom.modalSampleCount.textContent = countLabel;
  dom.lightboxSampleCount.textContent = countLabel;
}

async function hydrateTemplateSamples(template) {
  if (!template) {
    return [];
  }

  if (Array.isArray(template.samples) && template.samples.length > 0) {
    return getTemplateSamples(template);
  }

  const recovered = await recoverTemplatePreview(template);
  if (recovered?.samples) {
    return recovered.samples;
  }

  return getTemplateSamples(template);
}

function navigateActiveSample(delta) {
  if (!activeTemplate) {
    return false;
  }

  const samples = getTemplateSamples(activeTemplate);
  if (samples.length < 2) {
    return false;
  }

  activeSampleIndex = (activeSampleIndex + delta + samples.length) % samples.length;
  populateModal(activeTemplate);

  if (dom.lightboxOverlay.classList.contains('open')) {
    openLightbox(activeTemplate);
  }

  return true;
}

function isSameTemplate(left, right) {
  return Boolean(left && right && left.id === right.id && left.repo === right.repo);
}

function getTemplateStats(template) {
  return statsMap.get(getTemplateKey(template)) || EMPTY_STATS;
}

function getInstallDisplay(stats) {
  return typeof stats.installs === 'number' ? formatCount(stats.installs) : '--';
}

function getTrendingDisplay(stats) {
  if (typeof stats.trending !== 'number') {
    return '--';
  }

  if (stats.trending <= 0) {
    return '0';
  }

  return `+${formatCount(stats.trending)}`;
}

function prefersContainedPreview(aspect) {
  const parsed = parseAspect(aspect);
  return Boolean(parsed && parsed.width <= parsed.height);
}

function parseAspect(aspect) {
  if (!aspect || !String(aspect).includes(':')) {
    return null;
  }

  const [width, height] = String(aspect).split(':').map((value) => Number(value));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

function updateStructuredData() {
  if (!dom.structuredData || !catalog) {
    return;
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'BananaHub',
    url: catalog.site?.url || 'https://nano-banana-hub.github.io/',
    description: t('index.structuredData.pageDescription'),
    mainEntity: {
      '@type': 'DataCatalog',
      name: t('index.structuredData.catalogName'),
      url: catalog.site?.catalog_json || 'https://nano-banana-hub.github.io/catalog.json',
      description: t('index.structuredData.catalogDescription', {
        count: formatCount(allTemplates.length)
      }),
      inLanguage: ['en', 'zh-CN'],
      keywords: [
        'Nano Banana Skill',
        'prompt templates',
        'workflow templates',
        ...new Set((catalog.profiles || []).slice(0, 10))
      ]
    }
  };

  dom.structuredData.textContent = JSON.stringify(data, null, 2);
}

async function copyToClipboard(text, button) {
  const originalLabel = button.textContent;

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.style.position = 'fixed';
    fallback.style.left = '-9999px';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    document.body.removeChild(fallback);
  }

  button.textContent = t('common.action.copied');
  button.classList.add('copied');

  window.setTimeout(() => {
    button.textContent = getCopyButtonLabel(button, originalLabel);
    button.classList.remove('copied');
  }, 1400);
}

function formatCount(value) {
  if (typeof value !== 'number') {
    return String(value || '0');
  }

  return new Intl.NumberFormat(getCurrentLocale()).format(value);
}

function formatDate(value) {
  if (!value) {
    return t('common.value.unknown');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t('common.value.unknown');
  }

  return new Intl.DateTimeFormat(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function getLocalizedTemplateTitle(template) {
  if (getCurrentLanguage() === 'zh-CN') {
    return template.title || template.title_en || template.id;
  }

  return template.title_en || template.title || template.id;
}

function getLocalizedTemplateSubtitle(template, fallback = '') {
  const title = getLocalizedTemplateTitle(template);
  const alternateTitle = getCurrentLanguage() === 'zh-CN' ? template.title_en : template.title;

  if (alternateTitle && alternateTitle !== title) {
    return alternateTitle;
  }

  return fallback;
}

function getLocalizedTemplateDescription(template) {
  return template.description || t('common.template.noDescription');
}

function getTemplateCountLabel(count) {
  return t(
    count === 1 ? 'common.results.singleTemplateCount' : 'common.results.templateCount',
    { count: formatCount(count) }
  );
}

function getProfileCountLabel(count) {
  return t(
    count === 1 ? 'common.results.singleProfileCount' : 'common.results.profileCount',
    { count: formatCount(count) }
  );
}

function joinLocalizedList(items) {
  return items.join(getCurrentLanguage() === 'zh-CN' ? '，' : ', ');
}

function getCopyButtonLabel(button, fallback) {
  if (!button?.isConnected) {
    return fallback;
  }

  if (button.id === 'modal-copy-btn') {
    return t('common.action.copy');
  }

  return t('common.action.copyInstall');
}

function escHtml(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

init();
