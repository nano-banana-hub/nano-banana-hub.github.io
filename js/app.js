import { loadCatalog, getTemplates, filterTemplates, sortTemplates, searchTemplates } from './catalog.js';
import { fetchAllStats, getTemplateKey } from './api.js';

const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_WEB = 'https://github.com';
const DEFAULT_FILTERS = {
  source: 'all',
  profile: 'all',
  difficulty: 'all'
};

const DEFAULT_SORT = 'all-time';
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
let lastFocusTarget = null;
const previewRecoveryCache = new Map();

const dom = {
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
  lightboxImage: document.getElementById('lightbox-image'),
  lightboxOpenOriginalLink: document.getElementById('lightbox-open-original-link'),
  lightboxClose: document.getElementById('lightbox-close'),
  structuredData: document.getElementById('structured-data')
};

let imageObserver = null;

async function init() {
  bindEvents();
  readUrlState();
  syncUIFromState();

  try {
    catalog = await loadCatalog();
    allTemplates = getTemplates();
  } catch (error) {
    console.error('Failed to load catalog:', error);
    renderLoadError();
    return;
  }

  hydrateCatalogMeta();
  updateStructuredData();
  render();
  loadStats();
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
    if (activeTemplate?.sample_image) {
      openLightbox(activeTemplate);
    }
  });

  dom.modalViewImageBtn.addEventListener('click', () => {
    if (activeTemplate?.sample_image) {
      openLightbox(activeTemplate);
    }
  });

  dom.modalCopyBtn.addEventListener('click', () => {
    copyToClipboard(dom.modalInstallCmd.textContent || '', dom.modalCopyBtn);
  });

  dom.lightboxClose.addEventListener('click', closeLightbox);
  dom.lightboxOverlay.addEventListener('click', (event) => {
    if (event.target === dom.lightboxOverlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
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
}

function handleUrlNavigation() {
  readUrlState();
  syncUIFromState();
  render();
}

function renderLoadError() {
  dom.templateCount.textContent = '0';
  dom.profileCount.textContent = '0';
  dom.catalogGenerated.textContent = 'Unavailable';
  dom.resultCount.textContent = '0';
  dom.curatedCount.textContent = '0';
  dom.discoveredCount.textContent = '0';
  dom.resultsSummary.textContent = 'The catalog could not be loaded.';
  dom.catalogHint.textContent = 'Refresh the page or open catalog.json directly to inspect the generated catalog.';
  dom.grid.innerHTML = [
    '<div class="card-empty">',
    '<p>Failed to load templates.</p>',
    '<p>Please refresh the page or open catalog.json directly.</p>',
    '</div>'
  ].join('');
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
  dom.catalogGenerated.title = generatedAt || 'Unknown';
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
      '<p>No templates match the current view.</p>',
      '<p>Try removing a filter, switching sort mode, or resetting the search.</p>',
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
    activeDetails.push(`query "${currentSearch}"`);
  }

  if (currentFilters.source !== DEFAULT_FILTERS.source) {
    activeDetails.push(`source ${currentFilters.source}`);
  }

  if (currentFilters.profile !== DEFAULT_FILTERS.profile) {
    activeDetails.push(`profile ${currentFilters.profile}`);
  }

  if (currentFilters.difficulty !== DEFAULT_FILTERS.difficulty) {
    activeDetails.push(`difficulty ${currentFilters.difficulty}`);
  }

  dom.resultCount.textContent = formatCount(visibleTemplates.length);
  dom.curatedCount.textContent = formatCount(visibleCuratedCount);
  dom.discoveredCount.textContent = formatCount(visibleDiscoveredCount);

  if (visibleTemplates.length > 0) {
    const summaryBits = [`${formatCount(visibleTemplates.length)} template${visibleTemplates.length === 1 ? '' : 's'}`];

    if (visibleProfileCount > 0) {
      summaryBits.push(`${formatCount(visibleProfileCount)} profile${visibleProfileCount === 1 ? '' : 's'}`);
    }

    summaryBits.push(currentSort === 'trending' ? 'sorted by 24h trend' : 'sorted by installs');

    if (activeDetails.length > 0) {
      summaryBits.push(`filtered by ${activeDetails.join(', ')}`);
    }

    dom.resultsSummary.textContent = summaryBits.join(' · ');
  } else {
    dom.resultsSummary.textContent = 'No templates match the current search and filter combination.';
  }

  if (hasActiveState()) {
    dom.catalogHint.textContent = 'The current gallery view is encoded in the URL, so you can share this exact filter state.';
  } else {
    dom.catalogHint.textContent = `Click a card for the full brief, or use the install button directly. Catalog refreshed ${formatDate(catalog?.generated)} UTC.`;
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
  const title = template.title_en || template.title || template.id;
  const subtitle = template.title && template.title !== title ? template.title : '';
  const tagsHtml = (template.tags || [])
    .slice(0, 4)
    .map((tag) => `<span class="tag">${escHtml(tag)}</span>`)
    .join('');
  const hasSampleImage = Boolean(template.sample_image);
  const previewLabel = hasSampleImage ? 'Loading preview' : 'Preview unavailable';
  const sourceUrl = template.template_url || template.repo_url || '#';

  return `
    <article
      class="template-card"
      data-id="${escAttr(template.id)}"
      data-repo="${escAttr(template.repo)}"
      tabindex="0"
      role="button"
      aria-label="Open details for ${escAttr(title)}"
    >
      <div class="card-image-wrap${hasSampleImage ? '' : ' is-error'}${prefersContainedPreview(template.aspect) ? ' prefers-contain' : ''}">
        <div class="card-image-placeholder" aria-hidden="true">
          <span class="card-image-placeholder-label">${escHtml(previewLabel)}</span>
        </div>
        ${hasSampleImage ? `<img data-src="${escAttr(template.sample_image)}" alt="${escAttr(title)}" loading="lazy">` : ''}
        <div class="card-top-badges">
          <div class="card-top-badges-left">
            ${template.pinned ? '<span class="card-flag-badge">Pinned</span>' : ''}
            ${template.featured ? `<span class="card-flag-badge">${escHtml(template.featured_label || 'Featured')}</span>` : ''}
            ${template.official ? '<span class="card-official-badge">Official</span>' : '<span class="card-official-badge">Community</span>'}
            <span class="card-source-badge">${escHtml(template.catalog_source || 'curated')}</span>
          </div>
          <div class="card-top-badges-right">
            <span class="card-type-badge">${escHtml(template.type || 'prompt')}</span>
            <span class="card-profile-badge">${escHtml(template.profile || 'general')}</span>
          </div>
        </div>
        <span class="card-aspect-badge">${escHtml(template.aspect || 'n/a')}</span>
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
          ${tagsHtml || '<span class="tag">No tags</span>'}
        </div>

        <div class="card-meta-inline">
          <span>${escHtml(template.type || 'prompt')}</span>
          <span>${escHtml(template.difficulty || 'beginner')}</span>
          <span>${escHtml(template.aspect || 'n/a')}</span>
          <span data-stat-key="${escAttr(key)}" data-stat-type="trending">${escHtml(getTrendingDisplay(stats))} installs / 24h</span>
        </div>

        <div class="card-actions">
          <span class="card-action-stat" aria-label="${escAttr(`${getInstallDisplay(stats)} installs`)}">
            <span class="card-action-stat-value" data-stat-key="${escAttr(key)}" data-stat-type="installs">${escHtml(getInstallDisplay(stats))}</span>
            <small>installs</small>
          </span>
          <button class="copy-btn" data-cmd="${escAttr(template.install_cmd)}" type="button">Copy install</button>
          <a class="card-source-link" href="${escAttr(sourceUrl)}" target="_blank" rel="noopener">Source</a>
        </div>
      </div>
    </article>
  `;
}

function renderBadge(className, label) {
  return `<span class="${className}">${escHtml(label)}</span>`;
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
  lastFocusTarget = triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;
  populateModal(template);
  closeLightbox();
  dom.modalOverlay.classList.add('open');
  dom.modalOverlay.setAttribute('aria-hidden', 'false');
  updateBodyScrollLock();
  dom.modalClose.focus();
}

function populateModal(template) {
  const stats = getTemplateStats(template);
  const title = template.title_en || template.title || template.id;
  const subtitle = template.title && template.title !== title ? template.title : template.id;
  const templateUrl = getTemplateUrl(template);
  const originalImageUrl = getOriginalImageLink(template);
  const hasSampleImage = Boolean(template.sample_image);

  dom.modalTitle.textContent = title;
  dom.modalSubtitle.textContent = subtitle;
  dom.modalDesc.textContent = template.description || 'No description provided yet.';
  dom.modalAuthor.textContent = template.author || 'unknown';
  dom.modalVersion.textContent = template.version || '0.0.0';
  dom.modalAspect.textContent = template.aspect || 'n/a';
  dom.modalUpdated.textContent = template.updated || template.created || 'unknown';
  dom.modalInstalls.textContent = getInstallDisplay(stats);
  dom.modalTrending.textContent = getTrendingDisplay(stats);
  dom.modalInstallCmd.textContent = template.install_cmd || '';

  dom.modalBadges.innerHTML = [
    ...(template.pinned ? [renderBadge('badge badge-flag', 'pinned')] : []),
    ...(template.featured ? [renderBadge('badge badge-flag', template.featured_label || 'featured')] : []),
    renderBadge(`badge badge-type ${escAttr(template.type || 'prompt')}`, template.type || 'prompt'),
    renderBadge(`badge badge-profile ${escAttr(template.profile || 'general')}`, template.profile || 'general'),
    renderBadge('badge badge-difficulty', template.difficulty || 'beginner'),
    renderBadge('badge', template.official ? 'official' : 'community'),
    renderBadge('badge badge-source', template.catalog_source || 'curated')
  ].join('');

  dom.modalTags.innerHTML = (template.tags || []).length > 0
    ? template.tags.map((tag) => `<span class="tag">${escHtml(tag)}</span>`).join('')
    : '<span class="tag">No tags</span>';

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
    dom.modalImage.src = template.sample_image;
    dom.modalImage.alt = title;
    dom.modalImageButton.classList.remove('is-disabled');
    dom.modalImageButton.disabled = false;
    dom.modalImageHint.textContent = 'Open preview';
  } else {
    markModalPreviewUnavailable(title);
  }

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
  updateBodyScrollLock();

  if (lastFocusTarget instanceof HTMLElement) {
    lastFocusTarget.focus();
  }
}

function openLightbox(template) {
  if (!template?.sample_image) {
    return;
  }

  dom.lightboxImage.src = template.sample_image;
  dom.lightboxImage.alt = template.title_en || template.title || template.id;
  setLinkState(dom.lightboxOpenOriginalLink, getOriginalImageLink(template));
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
  updateBodyScrollLock();
}

function updateBodyScrollLock() {
  const isOpen = dom.modalOverlay.classList.contains('open') || dom.lightboxOverlay.classList.contains('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
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

function getOriginalImageLink(template) {
  return template.sample_image_page_url || template.sample_image || '';
}

function markPreviewUnavailable(wrap) {
  if (!wrap) {
    return;
  }

  wrap.classList.remove('is-loaded');
  wrap.classList.add('is-error');

  const label = wrap.querySelector('.card-image-placeholder-label');
  if (label) {
    label.textContent = 'Preview unavailable';
  }
}

function markModalPreviewUnavailable(title) {
  dom.modalImage.onerror = null;
  dom.modalImage.removeAttribute('src');
  dom.modalImage.alt = `${title} preview unavailable`;
  dom.modalImageButton.classList.add('is-disabled');
  dom.modalImageButton.disabled = true;
  dom.modalImageHint.textContent = 'Preview unavailable';
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
    const samples = Array.isArray(frontmatter?.samples) ? frontmatter.samples : [];
    if (samples.length === 0) {
      return null;
    }

    const firstSample = samples[0];
    const sampleFile = typeof firstSample === 'string' ? firstSample : firstSample?.file;
    if (!sampleFile) {
      return null;
    }

    const samplePath = joinRepoPath(template.template_path, sampleFile);
    const sampleImage = `${GITHUB_RAW}/${template.repo}/${template.branch}/${samplePath}`;
    const sampleImagePageUrl = `${GITHUB_WEB}/${template.repo}/blob/${template.branch}/${samplePath}`;

    template.sample_image = sampleImage;
    template.sample_image_page_url = sampleImagePageUrl;
    return { sampleImage, sampleImagePageUrl };
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
    description: 'Installable prompt and workflow template hub for Nano Banana Skill.',
    mainEntity: {
      '@type': 'DataCatalog',
      name: 'BananaHub Catalog',
      url: catalog.site?.catalog_json || 'https://nano-banana-hub.github.io/catalog.json',
      description: `Catalog of ${allTemplates.length} installable prompt and workflow templates for Nano Banana Skill.`,
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

  button.textContent = 'Copied';
  button.classList.add('copied');

  window.setTimeout(() => {
    button.textContent = originalLabel;
    button.classList.remove('copied');
  }, 1400);
}

function formatCount(value) {
  if (typeof value !== 'number') {
    return String(value || '0');
  }

  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
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
