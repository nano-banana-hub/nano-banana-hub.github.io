#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_WEB = 'https://github.com';
const HUB_API_BASE = process.env.BANANAHUB_API_BASE || 'https://worker.bananahub.ai/api';
const SITE_URL = 'https://bananahub.ai';
const KNOWN_SHORT_INSTALL_ROOTS = new Set(['references/templates', 'templates']);
const CANONICAL_REPO_ALIASES = new Map([
  ['nano-banana-hub/nanobanana', 'bananahub-ai/bananahub-skill'],
]);
const GENERATED_FILES = {
  catalog: 'catalog.json',
  catalogCurated: 'catalog-curated.json',
  catalogDiscovered: 'catalog-discovered.json',
  llms: 'llms.txt',
  agentCatalog: 'agent-catalog.md',
  robots: 'robots.txt',
  sitemap: 'sitemap.xml'
};

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};
  const lines = yaml.split(/\r?\n/);
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
      let cursor = index + 1;

      if (cursor < lines.length && /^  \w/.test(lines[cursor])) {
        const objectValue = {};
        while (cursor < lines.length && /^  \w/.test(lines[cursor])) {
          const nested = lines[cursor].match(/^  (\w[\w_]*):\s*(.*)/);
          if (nested) {
            const nestedValue = nested[2].trim();
            objectValue[nested[1]] = nestedValue.startsWith('[') && nestedValue.endsWith(']')
              ? nestedValue.slice(1, -1).split(',').map((value) => coerce(value.trim())).filter(Boolean)
              : coerce(nestedValue);
          }
          cursor += 1;
        }
        result[key] = objectValue;
        index = cursor;
        continue;
      }

      const items = [];

      while (cursor < lines.length && /^  - /.test(lines[cursor])) {
        const firstLine = lines[cursor].replace(/^  - /, '').trim();
        const objectValue = {};
        let hasObjectFields = false;

        const firstField = firstLine.match(/^(\w[\w_]*):\s*(.*)/);
        if (firstField) {
          objectValue[firstField[1]] = coerce(firstField[2].trim());
          hasObjectFields = true;
        } else if (firstLine) {
          items.push(coerce(firstLine));
          cursor += 1;
          continue;
        }

        cursor += 1;
        while (cursor < lines.length && /^    /.test(lines[cursor])) {
          if (/^      /.test(lines[cursor])) {
            cursor += 1;
            continue;
          }
          const nested = lines[cursor].match(/^    (\w[\w_]*):\s*(.*)/);
          if (nested) {
            const nestedKey = nested[1];
            const nestedValue = nested[2].trim();
            if (nestedValue === '') {
              const nestedItems = [];
              cursor += 1;
              while (cursor < lines.length && /^      - /.test(lines[cursor])) {
                const nestedItemLine = lines[cursor].replace(/^      - /, '').trim();
                const nestedObject = {};
                let nestedHasFields = false;
                const nestedFirstField = nestedItemLine.match(/^(\w[\w_]*):\s*(.*)/);
                if (nestedFirstField) {
                  nestedObject[nestedFirstField[1]] = coerce(nestedFirstField[2].trim());
                  nestedHasFields = true;
                } else if (nestedItemLine) {
                  nestedItems.push(coerce(nestedItemLine));
                  cursor += 1;
                  continue;
                }

                cursor += 1;
                while (cursor < lines.length && /^        \w/.test(lines[cursor])) {
                  const nestedAttr = lines[cursor].match(/^        (\w[\w_]*):\s*(.*)/);
                  if (nestedAttr) {
                    const attrValue = nestedAttr[2].trim();
                    nestedObject[nestedAttr[1]] = attrValue.startsWith('[') && attrValue.endsWith(']')
                      ? attrValue.slice(1, -1).split(',').map((value) => coerce(value.trim())).filter(Boolean)
                      : coerce(attrValue);
                    nestedHasFields = true;
                  }
                  cursor += 1;
                }

                nestedItems.push(nestedHasFields ? nestedObject : coerce(nestedItemLine));
              }
              objectValue[nestedKey] = nestedItems;
              hasObjectFields = true;
              continue;
            }
            objectValue[nestedKey] = coerce(nestedValue);
            hasObjectFields = true;
          }
          cursor += 1;
        }

        items.push(hasObjectFields ? objectValue : coerce(firstLine));
      }

      result[key] = items;
      index = cursor;
      continue;
    }

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      result[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map((value) => coerce(value.trim()))
        .filter(Boolean);
      index += 1;
      continue;
    }

    result[key] = coerce(rawValue);
    index += 1;
  }

  return result;
}

function coerce(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return Number.parseFloat(value);
  return value;
}

function extractDescription(content) {
  const body = content.replace(/^---[\s\S]*?---/, '').trim();
  const headingMatch = body.match(/##\s*(描述|Description)\s*\n\n([\s\S]*?)(?=\n##\s|$)/i);
  if (headingMatch) {
    return headingMatch[2].trim().replace(/\n+/g, ' ');
  }

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !paragraph.startsWith('#'));

  return paragraphs[0] ? paragraphs[0].replace(/\n+/g, ' ') : '';
}

function slugifyText(value) {
  return String(value || '').trim().toLowerCase();
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

function dirnameSafe(value) {
  const normalized = normalizePath(value);
  if (!normalized || !normalized.includes('/')) {
    return '';
  }
  return path.posix.dirname(normalized);
}

function basenameSafe(value) {
  const normalized = normalizePath(value);
  if (!normalized) {
    return '';
  }
  return path.posix.basename(normalized);
}

function isKnownShortInstallRoot(templateRoot) {
  return KNOWN_SHORT_INSTALL_ROOTS.has(slugifyText(templateRoot));
}

function buildTemplateKey(repo, id) {
  return `${slugifyText(repo)}::${slugifyText(id)}`;
}

function canonicalizeRepo(value) {
  const repo = String(value || '').trim();
  if (!repo) {
    return '';
  }

  return CANONICAL_REPO_ALIASES.get(slugifyText(repo)) || repo;
}

function buildInstallTargetFromTemplateDir(repoConfig, templateDirPath, templateSlug) {
  const explicitTarget = normalizePath(repoConfig.install_target || '');
  if (explicitTarget) {
    return explicitTarget;
  }

  const explicitPrefix = normalizePath(repoConfig.install_prefix || '');
  if (explicitPrefix) {
    return `${repoConfig.repo}/${joinRepoPath(explicitPrefix, templateSlug)}`;
  }

  const normalizedDir = normalizePath(templateDirPath);
  if (!normalizedDir) {
    return repoConfig.repo;
  }

  const templateRoot = dirnameSafe(normalizedDir);
  const resolvedSlug = templateSlug || basenameSafe(normalizedDir);

  if (!templateRoot) {
    return `${repoConfig.repo}/${resolvedSlug}`;
  }

  if (isKnownShortInstallRoot(templateRoot)) {
    return `${repoConfig.repo}/${resolvedSlug}`;
  }

  return `${repoConfig.repo}/${normalizedDir}`;
}

async function fetchWithRetry(url, headers, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number.parseInt(response.headers.get('x-ratelimit-reset') || '0', 10);
        const waitMs = Math.max((reset * 1000) - Date.now(), 1000);
        console.warn(`Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s...`);
        await sleep(waitMs);
        continue;
      }
      return response;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      await sleep(1000 * (attempt + 1));
    }
  }

  throw new Error(`Failed to fetch ${url}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRepoInfo(repo, headers) {
  const url = `${GITHUB_API}/repos/${repo}`;
  const response = await fetchWithRetry(url, headers);
  if (!response.ok) {
    throw new Error(`Failed to fetch repo info for ${repo}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchDirectoryItems(repo, relativePath, headers, { quiet = false } = {}) {
  const normalized = normalizePath(relativePath);
  const url = normalized
    ? `${GITHUB_API}/repos/${repo}/contents/${normalized}`
    : `${GITHUB_API}/repos/${repo}/contents`;

  if (!quiet) {
    console.log(`  Fetching directory listing: ${url}`);
  }

  const response = await fetchWithRetry(url, headers);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to list ${normalized || '.'} in ${repo}: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : null;
}

async function fetchRepoText(repo, branch, relativePath, headers, { quiet = false } = {}) {
  const normalized = normalizePath(relativePath);
  const url = normalized
    ? `${GITHUB_RAW}/${repo}/${branch}/${normalized}`
    : `${GITHUB_RAW}/${repo}/${branch}`;

  if (!quiet) {
    console.log(`  Fetching file: ${normalized || '.'}`);
  }

  const response = await fetchWithRetry(url, headers);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch ${normalized || '.'} from ${repo}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function resolveLocalRepoPath(rootDir, repoConfig) {
  const localPath = String(repoConfig.local_path || '').trim();
  if (!localPath) {
    return '';
  }

  const resolved = path.resolve(rootDir, localPath);
  if (!fs.existsSync(resolved)) {
    console.warn(`Local source path does not exist for ${repoConfig.repo}: ${resolved}`);
    return '';
  }

  return resolved;
}

function readLocalText(localRepoPath, relativePath) {
  const normalized = normalizePath(relativePath);
  const filePath = normalized ? path.join(localRepoPath, normalized) : localRepoPath;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function listLocalDirectoryItems(localRepoPath, relativePath) {
  const normalized = normalizePath(relativePath);
  const dirPath = normalized ? path.join(localRepoPath, normalized) : localRepoPath;
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return null;
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
    name: entry.name,
    type: entry.isDirectory() ? 'dir' : 'file',
  }));
}

async function fetchDiscoveredCandidates() {
  const url = `${HUB_API_BASE}/discovered?limit=500`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'BananaHub-Catalog-Builder/1.0' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
  } catch (error) {
    console.warn(`Discovered candidates unavailable: ${error.message}`);
    return [];
  }
}

function loadModeration(rootDir) {
  const moderationFile = path.join(rootDir, 'moderation.json');
  const defaultValue = {
    version: '1.0.0',
    pinned_templates: [],
    featured_templates: [],
    banned_repos: [],
    banned_templates: [],
  };

  if (!fs.existsSync(moderationFile)) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(moderationFile, 'utf8'));
    return {
      ...defaultValue,
      ...parsed,
      pinned_templates: Array.isArray(parsed.pinned_templates) ? parsed.pinned_templates : [],
      featured_templates: Array.isArray(parsed.featured_templates) ? parsed.featured_templates : [],
      banned_repos: Array.isArray(parsed.banned_repos) ? parsed.banned_repos : [],
      banned_templates: Array.isArray(parsed.banned_templates) ? parsed.banned_templates : [],
    };
  } catch (error) {
    console.warn(`Invalid moderation.json, using defaults: ${error.message}`);
    return defaultValue;
  }
}

function buildModerationIndex(moderation) {
  const bannedRepos = new Set(
    moderation.banned_repos.map((repo) => slugifyText(repo)).filter(Boolean)
  );
  const bannedTemplates = new Set(
    moderation.banned_templates
      .map((entry) => buildTemplateKey(entry.repo, entry.id || entry.template_id))
      .filter(Boolean)
  );
  const pinnedTemplates = new Map();
  const featuredTemplates = new Map();

  moderation.pinned_templates.forEach((entry, index) => {
    const key = buildTemplateKey(entry.repo, entry.id || entry.template_id);
    if (!key) {
      return;
    }

    pinnedTemplates.set(key, {
      rank: Number.isFinite(entry.rank) ? entry.rank : index + 1,
      note: entry.note || '',
    });
  });

  moderation.featured_templates.forEach((entry) => {
    const key = buildTemplateKey(entry.repo, entry.id || entry.template_id);
    if (!key) {
      return;
    }

    featuredTemplates.set(key, {
      label: entry.label || 'Featured',
      note: entry.note || '',
    });
  });

  return {
    bannedRepos,
    bannedTemplates,
    pinnedTemplates,
    featuredTemplates,
  };
}

function isBannedTemplate(template, moderationIndex) {
  if (moderationIndex.bannedRepos.has(slugifyText(template.repo))) {
    return true;
  }

  return moderationIndex.bannedTemplates.has(buildTemplateKey(template.repo, template.id));
}

function applyModeration(template, moderationIndex) {
  const key = buildTemplateKey(template.repo, template.id);
  const pinned = moderationIndex.pinnedTemplates.get(key);
  const featured = moderationIndex.featuredTemplates.get(key);

  return {
    ...template,
    pinned: Boolean(pinned),
    pinned_rank: pinned ? pinned.rank : null,
    featured: Boolean(featured),
    featured_label: featured?.label || '',
    featured_note: featured?.note || '',
  };
}

function normalizeProviderRecords(frontmatter) {
  const providers = Array.isArray(frontmatter.providers) ? frontmatter.providers : [];
  if (providers.length > 0) {
    return providers;
  }

  const legacyModels = Array.isArray(frontmatter.models) ? frontmatter.models : [];
  if (legacyModels.length === 0) {
    return [];
  }

  return [{
    id: 'google-ai-studio',
    family: 'gemini-image',
    models: legacyModels.map((entry) => {
      if (typeof entry === 'string') {
        return { id: entry, quality: 'untested' };
      }
      return {
        id: entry.name || entry.id || '',
        quality: entry.quality || 'untested',
        prompt_variant: entry.prompt_variant || 'default',
      };
    }).filter((entry) => entry.id),
  }];
}

function canonicalModelId(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'gpt-image2' || raw === 'gpt image 2') return 'gpt-image-2';
  if (raw === 'gpt-image' || raw === 'gpt image') return 'gpt-image-1';
  if (raw === 'nano-banana-pro' || raw === 'nano-banana-pro-preview') return 'gemini-3-pro-image-preview';
  if (raw === 'nano-banana-2' || raw === 'nano-banana-flash') return 'gemini-3.1-flash-image-preview';
  if (raw === 'nano-banana' || raw === 'nano-banana-1') return 'gemini-2.5-flash-image';
  return String(value || '').trim();
}

function getModelPriority(modelId) {
  const canonical = canonicalModelId(modelId);
  if (canonical === 'gpt-image-2') return 0;
  if (canonical === 'gemini-3-pro-image-preview') return 1;
  if (canonical === 'gemini-3.1-flash-image-preview') return 2;
  if (canonical === 'gpt-image-1') return 3;
  if (canonical === 'gemini-2.5-flash-image') return 4;
  if (canonical === 'gpt-5.4') return 5;
  return 9;
}

function deriveRecommendedModel(providers) {
  let best = null;
  for (const provider of providers || []) {
    for (const model of provider.models || []) {
      const modelId = canonicalModelId(model.id);
      if (!modelId) continue;
      const quality = String(model.quality || '').trim().toLowerCase();
      const candidate = {
        provider: provider.id || '',
        model: modelId,
        quality,
        priority: getRecommendationPriority({ provider: provider.id || '', model: modelId, quality })
      };
      if (!best || candidate.priority < best.priority) {
        best = candidate;
      }
    }
  }
  return best;
}

function getRecommendationPriority({ provider, model, quality }) {
  const canonical = canonicalModelId(model);
  const normalizedQuality = String(quality || '').toLowerCase();

  if (provider === 'google-ai-studio' && normalizedQuality === 'best') {
    return 0;
  }
  if (provider === 'google-ai-studio' && normalizedQuality === 'good') {
    return 1;
  }
  if (provider === 'openai' && ['best', 'good', 'ok', 'tested'].includes(normalizedQuality)) {
    return 2;
  }
  if (canonical === 'gemini-3-pro-image-preview') {
    return 3;
  }
  if (canonical === 'gemini-3.1-flash-image-preview') {
    return 4;
  }
  if (canonical === 'gpt-image-2') {
    return 5;
  }
  if (canonical === 'gpt-image-1') {
    return 6;
  }
  return 9;
}

function buildSampleRecords(sampleEntries, repo, branch, templateDir) {
  const entries = Array.isArray(sampleEntries) ? sampleEntries : [];

  return entries.map((entry) => {
    const sample = typeof entry === 'string' ? { file: entry } : (entry || {});
    const sampleFile = sample.file || '';
    if (!sampleFile) {
      return null;
    }

    const samplePath = joinRepoPath(templateDir, sampleFile);
    return {
      file: sampleFile,
      provider: sample.provider || '',
      model: sample.model || '',
      prompt_variant: sample.prompt_variant || '',
      prompt: sample.prompt || '',
      aspect: sample.aspect || '',
      size: sample.size || '',
      image: `${GITHUB_RAW}/${repo}/${branch}/${samplePath}`,
      page_url: `${GITHUB_WEB}/${repo}/blob/${branch}/${samplePath}`,
    };
  }).filter(Boolean);
}

function deriveDistribution(repoConfig) {
  return repoConfig.type === 'builtin' ? 'bundled' : 'remote';
}

function rewriteRepoPrefix(value, fromRepo, toRepo) {
  const input = String(value || '').trim();
  if (!input) {
    return input;
  }

  if (input === fromRepo) {
    return toRepo;
  }

  if (input.startsWith(`${fromRepo}/`)) {
    return `${toRepo}${input.slice(fromRepo.length)}`;
  }

  return input;
}

function normalizeOfficialInstallTarget(repo, installTarget) {
  const normalizedTarget = normalizePath(installTarget);
  const repoPrefix = `${repo}/`;
  if (!normalizedTarget.startsWith(repoPrefix)) {
    return normalizedTarget;
  }

  const tail = normalizePath(normalizedTarget.slice(repoPrefix.length));
  for (const root of KNOWN_SHORT_INSTALL_ROOTS) {
    const prefix = `${root}/`;
    if (tail.startsWith(prefix)) {
      return `${repo}/${tail.slice(prefix.length)}`;
    }
  }

  return normalizedTarget;
}

function normalizeDiscoveredCandidate(candidate) {
  const originalRepo = String(candidate.repo || '').trim();
  const canonicalRepo = canonicalizeRepo(originalRepo);
  const normalized = {
    ...candidate,
    repo: canonicalRepo,
    template_path: String(candidate.template_path || '').trim(),
  };

  normalized.install_target = normalizeOfficialInstallTarget(
    canonicalRepo,
    rewriteRepoPrefix(candidate.install_target, originalRepo, canonicalRepo)
  );
  return normalized;
}

function buildUseCommand(templateId) {
  return `/bananahub use ${templateId}`;
}

function normalizeTemplateLicense(value, { official = false } = {}) {
  const normalized = String(value || '').trim();
  if (normalized) return normalized;
  if (official) return 'CC-BY-4.0';
  return 'NOASSERTION';
}

function buildTemplateRecord({ repoConfig, repoInfo, templateDirPath, templateSlug, frontmatter, content, generatedAt }) {
  const normalizedTemplateDir = normalizePath(templateDirPath);
  const resolvedSlug = templateSlug || basenameSafe(normalizedTemplateDir) || frontmatter.id || '';
  const resolvedId = frontmatter.id || resolvedSlug || repoConfig.repo.split('/')[1];
  const description = extractDescription(content);
  const installTarget = buildInstallTargetFromTemplateDir(repoConfig, normalizedTemplateDir, resolvedSlug);
  const distribution = deriveDistribution(repoConfig);
  const useCmd = buildUseCommand(resolvedId);
  const installCmd = distribution === 'bundled' ? '' : `bananahub add ${installTarget}`;
  const primaryAction = distribution === 'bundled' ? 'use' : 'install';
  const primaryCmd = primaryAction === 'use' ? useCmd : installCmd;
  const samples = buildSampleRecords(frontmatter.samples, repoConfig.repo, repoInfo.default_branch, normalizedTemplateDir);
  const providers = normalizeProviderRecords(frontmatter);
  const recommended = deriveRecommendedModel(providers);
  const sampleImage = samples[0]?.image || '';
  const sampleImagePageUrl = samples[0]?.page_url || '';

  const templateRoot = dirnameSafe(normalizedTemplateDir);
  const templateUrl = normalizedTemplateDir
    ? `${GITHUB_WEB}/${repoConfig.repo}/tree/${repoInfo.default_branch}/${normalizedTemplateDir}`
    : `${GITHUB_WEB}/${repoConfig.repo}/tree/${repoInfo.default_branch}`;

  return {
    id: resolvedId,
    type: frontmatter.type || 'prompt',
    title: frontmatter.title || '',
    title_en: frontmatter.title_en || frontmatter.title || resolvedId,
    author: frontmatter.author || 'unknown',
    license: normalizeTemplateLicense(frontmatter.license, { official: Boolean(repoConfig.official) }),
    version: frontmatter.version || '1.0.0',
    profile: frontmatter.profile || 'general',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    models: Array.isArray(frontmatter.models) ? frontmatter.models : [],
    providers,
    capabilities: frontmatter.capabilities || {},
    prompt_variants: frontmatter.prompt_variants || {},
    recommended_provider: recommended?.provider || '',
    recommended_model: recommended?.model || '',
    model_priority: Number.isFinite(recommended?.priority) ? recommended.priority : 99,
    schema_version: providers.length > 0 || frontmatter.capabilities || frontmatter.prompt_variants ? 2 : 1,
    aspect: frontmatter.aspect || '1:1',
    difficulty: frontmatter.difficulty || 'beginner',
    description,
    samples,
    sample_image: sampleImage,
    sample_image_page_url: sampleImagePageUrl,
    repo: repoConfig.repo,
    repo_url: repoInfo.html_url || `${GITHUB_WEB}/${repoConfig.repo}`,
    branch: repoInfo.default_branch,
    distribution,
    template_root: templateRoot,
    template_path: normalizedTemplateDir,
    template_url: templateUrl,
    official: Boolean(repoConfig.official),
    catalog_source: repoConfig.catalog_source || 'curated',
    use_cmd: useCmd,
    install_target: installTarget,
    install_cmd: installCmd,
    primary_action: primaryAction,
    primary_cmd: primaryCmd,
    install_required: distribution !== 'bundled',
    usage_stats_url: `${HUB_API_BASE}/usage-stats?repo=${encodeURIComponent(repoConfig.repo)}&template_id=${encodeURIComponent(resolvedId)}`,
    created: frontmatter.created || generatedAt.slice(0, 10),
    updated: frontmatter.updated || generatedAt.slice(0, 10),
  };
}

async function resolveTemplateAtDir({ repoConfig, repoInfo, templateDirPath, templateSlug, headers, generatedAt }) {
  const templateMdPath = joinRepoPath(templateDirPath, 'template.md');
  const content = await fetchRepoText(repoConfig.repo, repoInfo.default_branch, templateMdPath, headers, { quiet: true });
  if (!content) {
    return null;
  }

  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    console.warn(`  No frontmatter in ${templateMdPath}`);
    return null;
  }

  return buildTemplateRecord({
    repoConfig,
    repoInfo,
    templateDirPath,
    templateSlug,
    frontmatter,
    content,
    generatedAt,
  });
}

function resolveLocalTemplateAtDir({ repoConfig, repoInfo, localRepoPath, templateDirPath, templateSlug, generatedAt }) {
  const templateMdPath = joinRepoPath(templateDirPath, 'template.md');
  const content = readLocalText(localRepoPath, templateMdPath);
  if (!content) {
    return null;
  }

  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    console.warn(`  No frontmatter in ${templateMdPath}`);
    return null;
  }

  return buildTemplateRecord({
    repoConfig,
    repoInfo,
    templateDirPath,
    templateSlug,
    frontmatter,
    content,
    generatedAt,
  });
}

async function resolveRootSingleTemplate(repoConfig, repoInfo, candidateTemplateId, headers, generatedAt) {
  const content = await fetchRepoText(repoConfig.repo, repoInfo.default_branch, 'template.md', headers, { quiet: true });
  if (!content) {
    return null;
  }

  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    return null;
  }

  if (candidateTemplateId && frontmatter.id && frontmatter.id !== candidateTemplateId) {
    return null;
  }

  return buildTemplateRecord({
    repoConfig,
    repoInfo,
    templateDirPath: '',
    templateSlug: '',
    frontmatter,
    content,
    generatedAt,
  });
}

async function resolveFromRootManifest(repoConfig, repoInfo, candidateTemplateId, headers, generatedAt) {
  if (!candidateTemplateId) {
    return null;
  }

  const manifestText = await fetchRepoText(repoConfig.repo, repoInfo.default_branch, 'bananahub.json', headers, { quiet: true });
  if (!manifestText) {
    return null;
  }

  try {
    const manifest = JSON.parse(manifestText);
    if (!Array.isArray(manifest.templates) || !manifest.templates.includes(candidateTemplateId)) {
      return null;
    }
  } catch {
    return null;
  }

  return resolveTemplateAtDir({
    repoConfig,
    repoInfo,
    templateDirPath: candidateTemplateId,
    templateSlug: candidateTemplateId,
    headers,
    generatedAt,
  });
}

function deriveInstallTail(candidate) {
  const repo = String(candidate.repo || '').trim();
  const installTarget = String(candidate.install_target || '').trim();
  if (!repo || !installTarget || !installTarget.startsWith(`${repo}/`)) {
    return '';
  }

  return normalizePath(installTarget.slice(repo.length + 1));
}

async function resolveDiscoveredCandidate(candidate, repoInfo, headers, generatedAt) {
  const repoConfig = {
    repo: candidate.repo,
    official: false,
    catalog_source: 'discovered',
    install_target: candidate.install_target || '',
  };

  const attempts = [];
  const explicitTemplatePath = normalizePath(candidate.template_path);
  const installTail = deriveInstallTail(candidate);
  const candidateTemplateId = String(candidate.template_id || '').trim();

  if (explicitTemplatePath) {
    attempts.push({ type: 'path', value: explicitTemplatePath });
  }

  if (installTail && installTail !== explicitTemplatePath && installTail !== candidateTemplateId) {
    attempts.push({ type: 'path', value: installTail });
  }

  attempts.push({ type: 'root-single' });

  if (candidateTemplateId) {
    attempts.push({ type: 'path', value: candidateTemplateId });
    attempts.push({ type: 'root-manifest', value: candidateTemplateId });
    for (const root of KNOWN_SHORT_INSTALL_ROOTS) {
      attempts.push({ type: 'path', value: joinRepoPath(root, candidateTemplateId) });
    }
  }

  const seen = new Set();
  for (const attempt of attempts) {
    const attemptKey = `${attempt.type}:${attempt.value || ''}`;
    if (seen.has(attemptKey)) {
      continue;
    }
    seen.add(attemptKey);

    try {
      if (attempt.type === 'root-single') {
        const template = await resolveRootSingleTemplate(repoConfig, repoInfo, candidateTemplateId, headers, generatedAt);
        if (template) {
          return template;
        }
      } else if (attempt.type === 'root-manifest') {
        const template = await resolveFromRootManifest(repoConfig, repoInfo, attempt.value, headers, generatedAt);
        if (template) {
          return template;
        }
      } else if (attempt.type === 'path') {
        const template = await resolveTemplateAtDir({
          repoConfig,
          repoInfo,
          templateDirPath: attempt.value,
          templateSlug: basenameSafe(attempt.value),
          headers,
          generatedAt,
        });
        if (template && (!candidateTemplateId || template.id === candidateTemplateId || basenameSafe(attempt.value) === candidateTemplateId)) {
          return template;
        }
      }
    } catch (error) {
      console.warn(`  Failed to resolve discovered template ${candidate.repo}/${candidate.template_id}: ${error.message}`);
    }
  }

  return null;
}

function compareControlledTemplates(left, right) {
  const leftPinned = Number.isFinite(left.pinned_rank) ? left.pinned_rank : Number.POSITIVE_INFINITY;
  const rightPinned = Number.isFinite(right.pinned_rank) ? right.pinned_rank : Number.POSITIVE_INFINITY;
  if (leftPinned !== rightPinned) {
    return leftPinned - rightPinned;
  }

  if (Boolean(left.featured) !== Boolean(right.featured)) {
    return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
  }

  if (Boolean(left.official) !== Boolean(right.official)) {
    return Number(Boolean(right.official)) - Number(Boolean(left.official));
  }

  return left.id.localeCompare(right.id, 'en');
}

function buildLayerSummary(templates) {
  const repos = [...new Set(templates.map((template) => template.repo))].sort();
  return {
    template_count: templates.length,
    official_count: templates.filter((template) => template.official).length,
    bundled_count: templates.filter((template) => template.distribution === 'bundled').length,
    remote_count: templates.filter((template) => template.distribution !== 'bundled').length,
    repos,
  };
}

function buildCatalog({ version, generatedAt, catalogType, templates, curatedTemplates, discoveredTemplates }) {
  const profiles = [...new Set(templates.map((template) => template.profile))].sort();
  const repos = [...new Set(templates.map((template) => template.repo))].sort();
  const officialCount = templates.filter((template) => template.official).length;
  const featuredCount = templates.filter((template) => template.featured).length;
  const pinnedCount = templates.filter((template) => template.pinned).length;
  const bundledCount = templates.filter((template) => template.distribution === 'bundled').length;
  const remoteCount = templates.filter((template) => template.distribution !== 'bundled').length;
  const curatedSummary = buildLayerSummary(curatedTemplates);
  const discoveredSummary = buildLayerSummary(discoveredTemplates);

  return {
    version,
    catalog_type: catalogType,
    generated: generatedAt,
    site: {
      url: `${SITE_URL}/`,
      hub_api_base: HUB_API_BASE,
      catalog_json: `${SITE_URL}/${GENERATED_FILES.catalog}`,
      catalog_curated_json: `${SITE_URL}/${GENERATED_FILES.catalogCurated}`,
      catalog_discovered_json: `${SITE_URL}/${GENERATED_FILES.catalogDiscovered}`,
      llms_txt: `${SITE_URL}/${GENERATED_FILES.llms}`,
      agent_catalog: `${SITE_URL}/${GENERATED_FILES.agentCatalog}`,
    },
    summary: {
      template_count: templates.length,
      profile_count: profiles.length,
      official_count: officialCount,
      featured_count: featuredCount,
      pinned_count: pinnedCount,
      bundled_count: bundledCount,
      remote_count: remoteCount,
      curated_count: curatedSummary.template_count,
      discovered_count: discoveredSummary.template_count,
      repos,
    },
    layers: {
      curated: curatedSummary,
      discovered: discoveredSummary,
    },
    profiles,
    templates,
  };
}

function buildLlmsTxt(catalog) {
  const lines = [
    '# BananaHub',
    '',
    'BananaHub is the searchable template catalog for BananaHub Skill.',
    'The catalog mixes a small built-in starter pack with installable remote templates.',
    'Templates may be lightweight prompts or multi-step workflows.',
    'The catalog has two layers: curated templates for reviewed defaults, and discovered templates collected automatically from real installs.',
    'Curated is the recommendation layer. Discovered is the open discovery layer. Moderation rules can ban or pin templates independently of either layer.',
    'Built-in templates should be used directly inside BananaHub Skill. Install counts apply only to remote templates.',
    '',
    `Canonical site: ${catalog.site.url}`,
    '',
    'Preferred machine-readable entry points:',
    `- ${catalog.site.catalog_json} — merged catalog with curated + discovered templates`,
    `- ${catalog.site.catalog_curated_json} — curated-only catalog`,
    `- ${catalog.site.catalog_discovered_json} — discovered-only catalog`,
    `- ${catalog.site.agent_catalog} — markdown digest of the current catalog`,
    `- ${catalog.site.llms_txt} — this overview`,
    '',
    'Command rules:',
    '- Prefer primary_cmd for the next action.',
    '- Built-in templates use primary_action=use and do not need installation.',
    '- Installable templates use primary_action=install; install_cmd is provided only for that subset.',
    '- Curated templates are not the only valid templates. Discovered templates are intentionally open and may be unreviewed.',
    '- Pinned templates should be treated as stronger defaults than raw install counts alone.',
    '',
    'How to use BananaHub as an agent:',
    '- Read catalog.json first for merged discovery and moderation flags.',
    '- Use catalog_source to distinguish curated from discovered entries.',
    '- Use distribution to distinguish built-in starter templates from installable remote templates.',
    '- For built-in template adoption counts, use usage_stats_url or call /usage-stats with repo + template_id.',
    '- Respect pinned and featured flags before raw popularity when choosing defaults.',
    '- Use template_url when the full template body is needed.',
    '- Use type to distinguish prompt templates from workflow templates.',
    '- Use license to surface the declared template license before recommending reuse or redistribution.',
    '- Use samples when multiple preview assets exist; sample_image and sample_image_page_url remain the first-sample shortcuts.',
    '',
    'Ecosystem links:',
    '- BananaHub Skill repo: https://github.com/bananahub-ai/bananahub-skill',
    '- BananaHub CLI: https://www.npmjs.com/package/bananahub',
    '- Template system docs: https://github.com/bananahub-ai/bananahub-skill/blob/main/references/template-system.md',
    '- Template format spec: https://github.com/bananahub-ai/bananahub-skill/blob/main/references/template-format-spec.md',
    '',
    `Current catalog summary: ${catalog.summary.template_count} templates total, ${catalog.summary.bundled_count} bundled, ${catalog.summary.remote_count} remote, ${catalog.summary.curated_count} curated, ${catalog.summary.discovered_count} discovered, ${catalog.summary.pinned_count} pinned, ${catalog.summary.featured_count} featured.`,
    `Generated: ${catalog.generated}`,
  ];

  return `${lines.join('\n')}\n`;
}

function buildAgentCatalog(catalog) {
  const lines = [
    '# BananaHub Agent Catalog',
    '',
    `Generated: ${catalog.generated}`,
    '',
    'BananaHub is the installable template network for BananaHub Skill.',
    'Use `catalog.json` for structured access. This markdown file is a readable digest of the merged catalog.',
    '',
    '## Entry Points',
    '',
    `- Site: ${catalog.site.url}`,
    `- Merged Catalog JSON: ${catalog.site.catalog_json}`,
    `- Curated Catalog JSON: ${catalog.site.catalog_curated_json}`,
    `- Discovered Catalog JSON: ${catalog.site.catalog_discovered_json}`,
    `- llms.txt: ${catalog.site.llms_txt}`,
    '',
    `## Curated Templates (${catalog.layers.curated.template_count})`,
    '',
  ];

  const curatedTemplates = catalog.templates.filter((template) => template.catalog_source === 'curated');
  const discoveredTemplates = catalog.templates.filter((template) => template.catalog_source === 'discovered');

  for (const template of curatedTemplates) {
    appendTemplateDigest(lines, template);
  }

  lines.push(`## Discovered Templates (${catalog.layers.discovered.template_count})`);
  lines.push('');

  for (const template of discoveredTemplates) {
    appendTemplateDigest(lines, template);
  }

  return `${lines.join('\n')}\n`;
}

function appendTemplateDigest(lines, template) {
  lines.push(`### ${template.id}`);
  lines.push(`- Title: ${template.title_en}${template.title && template.title !== template.title_en ? ` / ${template.title}` : ''}`);
  lines.push(`- Type: ${template.type || 'prompt'}`);
  lines.push(`- Profile: ${template.profile}`);
  lines.push(`- Difficulty: ${template.difficulty}`);
  lines.push(`- Source Layer: ${template.catalog_source}`);
  lines.push(`- Distribution: ${template.distribution}`);
  lines.push(`- License: ${template.license || 'NOASSERTION'}`);
  lines.push(`- Official: ${template.official ? 'yes' : 'no'}`);
  lines.push(`- Featured: ${template.featured ? (template.featured_label || 'yes') : 'no'}`);
  lines.push(`- Pinned: ${template.pinned ? `yes${Number.isFinite(template.pinned_rank) ? ` (#${template.pinned_rank})` : ''}` : 'no'}`);
  lines.push(`- Tags: ${template.tags.join(', ') || 'none'}`);
  lines.push(`- Description: ${template.description || 'No description provided.'}`);
  lines.push(`- Primary Action: ${template.primary_action}`);
  lines.push(`- Primary Command: \`${template.primary_cmd}\``);
  if (template.install_cmd) {
    lines.push(`- Install Command: \`${template.install_cmd}\``);
  }
  if (template.usage_stats_url) {
    lines.push(`- Usage Stats: ${template.usage_stats_url}`);
  }
  lines.push(`- Template Source: ${template.template_url}`);
  if (template.sample_image) {
    lines.push(`- Preview Image: ${template.sample_image}`);
  }
  lines.push('');
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/${GENERATED_FILES.sitemap}\n`;
}

function buildSitemapXml(generatedAt) {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/about.html`,
    `${SITE_URL}/${GENERATED_FILES.catalog}`,
    `${SITE_URL}/${GENERATED_FILES.catalogCurated}`,
    `${SITE_URL}/${GENERATED_FILES.catalogDiscovered}`,
    `${SITE_URL}/${GENERATED_FILES.llms}`,
    `${SITE_URL}/${GENERATED_FILES.agentCatalog}`,
  ];

  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${escapeXml(generatedAt)}</lastmod>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function writeOutput(filePath, contents) {
  fs.writeFileSync(filePath, contents, 'utf8');
  console.log(`Wrote ${path.basename(filePath)}`);
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const sourceFile = path.join(rootDir, 'catalog-source.json');
  const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const moderation = loadModeration(rootDir);
  const moderationIndex = buildModerationIndex(moderation);
  const generatedAt = new Date().toISOString();
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'BananaHub-Catalog-Builder/1.0',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    console.log('Using GITHUB_TOKEN for authentication.\n');
  } else {
    console.log('No GITHUB_TOKEN found. Using unauthenticated requests (60/hr limit).\n');
  }

  const repoInfoCache = new Map();
  const getRepoInfoCached = async (repo) => {
    if (!repoInfoCache.has(repo)) {
      repoInfoCache.set(repo, fetchRepoInfo(repo, headers));
    }
    return repoInfoCache.get(repo);
  };

  const curatedRaw = [];
  for (const repoConfig of source.repos) {
    if (moderationIndex.bannedRepos.has(slugifyText(repoConfig.repo))) {
      console.log(`Skipping banned curated repo: ${repoConfig.repo}\n`);
      continue;
    }

    console.log(`Processing curated repo: ${repoConfig.repo}`);
    const repoInfo = await getRepoInfoCached(repoConfig.repo);
    const localRepoPath = resolveLocalRepoPath(rootDir, repoConfig);
    const collectionPath = normalizePath(repoConfig.path);
    const curatedRepoConfig = { ...repoConfig, catalog_source: 'curated' };
    const directTemplate = localRepoPath
      ? resolveLocalTemplateAtDir({
        repoConfig: curatedRepoConfig,
        repoInfo,
        localRepoPath,
        templateDirPath: collectionPath,
        templateSlug: basenameSafe(collectionPath),
        generatedAt,
      })
      : await resolveTemplateAtDir({
        repoConfig: curatedRepoConfig,
        repoInfo,
        templateDirPath: collectionPath,
        templateSlug: basenameSafe(collectionPath),
        headers,
        generatedAt,
      });

    if (directTemplate) {
      curatedRaw.push(directTemplate);
      console.log(`  Found single template at ${collectionPath || '/'}\n`);
      console.log(`  + ${directTemplate.id} (${directTemplate.profile}, ${directTemplate.difficulty})\n`);
      continue;
    }

    const templateItems = localRepoPath
      ? listLocalDirectoryItems(localRepoPath, collectionPath)
      : await fetchDirectoryItems(repoConfig.repo, collectionPath, headers);
    const templateDirs = Array.isArray(templateItems)
      ? templateItems.filter((item) => item.type === 'dir').map((item) => item.name).sort()
      : [];

    if (localRepoPath) {
      console.log(`  Using local workspace source: ${localRepoPath}`);
    }
    console.log(`  Found ${templateDirs.length} templates: ${templateDirs.join(', ')}\n`);

    for (const templateSlug of templateDirs) {
      const templateDirPath = joinRepoPath(collectionPath, templateSlug);
      const template = localRepoPath
        ? resolveLocalTemplateAtDir({
          repoConfig: curatedRepoConfig,
          repoInfo,
          localRepoPath,
          templateDirPath,
          templateSlug,
          generatedAt,
        })
        : await resolveTemplateAtDir({
          repoConfig: curatedRepoConfig,
          repoInfo,
          templateDirPath,
          templateSlug,
          headers,
          generatedAt,
        });

      if (!template) {
        continue;
      }

      curatedRaw.push(template);
      console.log(`  + ${template.id} (${template.profile}, ${template.difficulty})`);
    }

    console.log('');
  }

  console.log('Fetching discovered candidates...\n');
  const discoveredCandidates = await fetchDiscoveredCandidates();
  const discoveredRaw = [];

  for (const rawCandidate of discoveredCandidates) {
    const candidate = normalizeDiscoveredCandidate(rawCandidate);
    if (moderationIndex.bannedRepos.has(slugifyText(candidate.repo))) {
      continue;
    }

    if (moderationIndex.bannedTemplates.has(buildTemplateKey(candidate.repo, candidate.template_id))) {
      continue;
    }

    try {
      console.log(`Processing discovered candidate: ${candidate.repo}/${candidate.template_id}`);
      const repoInfo = await getRepoInfoCached(candidate.repo);
      const template = await resolveDiscoveredCandidate(candidate, repoInfo, headers, generatedAt);

      if (!template) {
        console.log('  ! Could not resolve template path from install metadata.\n');
        continue;
      }

      discoveredRaw.push(template);
      console.log(`  + ${template.id} (${template.profile}, ${template.difficulty})\n`);
    } catch (error) {
      console.warn(`  ! Failed to process discovered candidate ${candidate.repo}/${candidate.template_id}: ${error.message}\n`);
    }
  }

  const curatedTemplates = curatedRaw
    .filter((template) => !isBannedTemplate(template, moderationIndex))
    .map((template) => applyModeration(template, moderationIndex))
    .sort(compareControlledTemplates);

  const curatedKeys = new Set(curatedTemplates.map((template) => buildTemplateKey(template.repo, template.id)));
  const discoveredTemplates = discoveredRaw
    .filter((template) => !isBannedTemplate(template, moderationIndex))
    .filter((template) => !curatedKeys.has(buildTemplateKey(template.repo, template.id)))
    .map((template) => applyModeration(template, moderationIndex))
    .sort(compareControlledTemplates);

  const mergedTemplates = [...curatedTemplates, ...discoveredTemplates].sort(compareControlledTemplates);

  const mergedCatalog = buildCatalog({
    version: source.version,
    generatedAt,
    catalogType: 'merged',
    templates: mergedTemplates,
    curatedTemplates,
    discoveredTemplates,
  });

  const curatedCatalog = buildCatalog({
    version: source.version,
    generatedAt,
    catalogType: 'curated',
    templates: curatedTemplates,
    curatedTemplates,
    discoveredTemplates: [],
  });

  const discoveredCatalog = buildCatalog({
    version: source.version,
    generatedAt,
    catalogType: 'discovered',
    templates: discoveredTemplates,
    curatedTemplates: [],
    discoveredTemplates,
  });

  writeOutput(path.join(rootDir, GENERATED_FILES.catalog), `${JSON.stringify(mergedCatalog, null, 2)}\n`);
  writeOutput(path.join(rootDir, GENERATED_FILES.catalogCurated), `${JSON.stringify(curatedCatalog, null, 2)}\n`);
  writeOutput(path.join(rootDir, GENERATED_FILES.catalogDiscovered), `${JSON.stringify(discoveredCatalog, null, 2)}\n`);
  writeOutput(path.join(rootDir, GENERATED_FILES.llms), buildLlmsTxt(mergedCatalog));
  writeOutput(path.join(rootDir, GENERATED_FILES.agentCatalog), buildAgentCatalog(mergedCatalog));
  writeOutput(path.join(rootDir, GENERATED_FILES.robots), buildRobotsTxt());
  writeOutput(path.join(rootDir, GENERATED_FILES.sitemap), buildSitemapXml(generatedAt));

  console.log(`Curated templates: ${curatedTemplates.length}`);
  console.log(`Discovered templates: ${discoveredTemplates.length}`);
  console.log(`Total templates: ${mergedTemplates.length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
