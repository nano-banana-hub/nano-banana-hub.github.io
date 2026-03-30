#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com';
const GITHUB_RAW = 'https://raw.githubusercontent.com';
const GITHUB_WEB = 'https://github.com';
const SITE_URL = 'https://nano-banana-hub.github.io';
const KNOWN_SHORT_INSTALL_ROOTS = new Set(['references/templates', 'templates']);
const GENERATED_FILES = {
  catalog: 'catalog.json',
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
      const items = [];
      let cursor = index + 1;

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
        while (cursor < lines.length && /^    \w/.test(lines[cursor])) {
          const nested = lines[cursor].match(/^    (\w[\w_]*):\s*(.*)/);
          if (nested) {
            objectValue[nested[1]] = coerce(nested[2].trim());
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

function isKnownShortInstallRoot(templateRoot) {
  return KNOWN_SHORT_INSTALL_ROOTS.has(slugifyText(templateRoot));
}

function buildInstallTarget(repoConfig, templateId) {
  if (repoConfig.install_prefix) {
    return `${repoConfig.repo}/${repoConfig.install_prefix.replace(/^\/+|\/+$/g, '')}/${templateId}`;
  }

  if (isKnownShortInstallRoot(repoConfig.path)) {
    return `${repoConfig.repo}/${templateId}`;
  }

  return `${repoConfig.repo}/${repoConfig.path.replace(/^\/+|\/+$/g, '')}/${templateId}`;
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

async function fetchTemplateIds(repo, templatePath, headers) {
  const url = `${GITHUB_API}/repos/${repo}/contents/${templatePath}`;
  console.log(`  Fetching directory listing: ${url}`);
  const response = await fetchWithRetry(url, headers);
  if (!response.ok) {
    console.error(`  Failed to list templates: ${response.status} ${response.statusText}`);
    return [];
  }

  const items = await response.json();
  return items.filter((item) => item.type === 'dir').map((item) => item.name).sort();
}

async function fetchTemplateContent(repo, branch, templatePath, templateId, headers) {
  const url = `${GITHUB_RAW}/${repo}/${branch}/${templatePath}/${templateId}/template.md`;
  console.log(`  Fetching: ${templateId}/template.md`);
  const response = await fetchWithRetry(url, headers);
  if (!response.ok) {
    console.error(`  Failed to fetch ${templateId}: ${response.status}`);
    return null;
  }
  return response.text();
}

function buildTemplatePath(templateRoot, templateId) {
  return `${templateRoot}/${templateId}`;
}

function buildTemplateUrl(repo, branch, templateRoot, templateId) {
  return `${GITHUB_WEB}/${repo}/tree/${branch}/${templateRoot}/${templateId}`;
}

function buildSampleImageUrl(repo, branch, templateRoot, templateId, sampleFile) {
  return `${GITHUB_RAW}/${repo}/${branch}/${templateRoot}/${templateId}/${sampleFile}`;
}

function buildSampleImagePageUrl(repo, branch, templateRoot, templateId, sampleFile) {
  return `${GITHUB_WEB}/${repo}/blob/${branch}/${templateRoot}/${templateId}/${sampleFile}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildTemplateRecord(repoConfig, repoInfo, templateId, frontmatter, content, generatedAt) {
  const description = extractDescription(content);
  const templatePath = buildTemplatePath(repoConfig.path, templateId);
  const installTarget = buildInstallTarget(repoConfig, templateId);

  let sampleImage = '';
  let sampleImagePageUrl = '';
  const samples = safeArray(frontmatter.samples);
  if (samples.length > 0) {
    const firstSample = samples[0];
    const sampleFile = typeof firstSample === 'string' ? firstSample : firstSample.file;
    if (sampleFile) {
      sampleImage = buildSampleImageUrl(repoConfig.repo, repoInfo.default_branch, repoConfig.path, templateId, sampleFile);
      sampleImagePageUrl = buildSampleImagePageUrl(repoConfig.repo, repoInfo.default_branch, repoConfig.path, templateId, sampleFile);
    }
  }

  return {
    id: frontmatter.id || templateId,
    title: frontmatter.title || '',
    title_en: frontmatter.title_en || frontmatter.title || templateId,
    author: frontmatter.author || 'unknown',
    version: frontmatter.version || '1.0.0',
    profile: frontmatter.profile || 'general',
    tags: safeArray(frontmatter.tags),
    aspect: frontmatter.aspect || '1:1',
    difficulty: frontmatter.difficulty || 'beginner',
    description,
    sample_image: sampleImage,
    sample_image_page_url: sampleImagePageUrl,
    repo: repoConfig.repo,
    repo_url: repoInfo.html_url || `${GITHUB_WEB}/${repoConfig.repo}`,
    branch: repoInfo.default_branch,
    template_root: repoConfig.path,
    template_path: templatePath,
    template_url: buildTemplateUrl(repoConfig.repo, repoInfo.default_branch, repoConfig.path, templateId),
    official: Boolean(repoConfig.official),
    install_target: installTarget,
    install_cmd: `bananahub add ${installTarget}`,
    created: frontmatter.created || generatedAt.slice(0, 10),
    updated: frontmatter.updated || generatedAt.slice(0, 10)
  };
}

function buildCatalog(source, templates, generatedAt) {
  const profiles = [...new Set(templates.map((template) => template.profile))].sort();
  const repos = [...new Set(templates.map((template) => template.repo))].sort();
  const officialCount = templates.filter((template) => template.official).length;

  return {
    version: source.version,
    generated: generatedAt,
    site: {
      url: `${SITE_URL}/`,
      catalog_json: `${SITE_URL}/${GENERATED_FILES.catalog}`,
      llms_txt: `${SITE_URL}/${GENERATED_FILES.llms}`,
      agent_catalog: `${SITE_URL}/${GENERATED_FILES.agentCatalog}`
    },
    summary: {
      template_count: templates.length,
      profile_count: profiles.length,
      official_count: officialCount,
      repos
    },
    profiles,
    templates
  };
}

function buildLlmsTxt(catalog) {
  const lines = [
    '# BananaHub',
    '',
    'BananaHub is the plug-in prompt template hub for Nano Banana Skill.',
    'It is designed for progressive disclosure: keep the base skill lean, discover templates through stable files, and install only the module that matches the current task.',
    '',
    `Canonical site: ${catalog.site.url}`,
    '',
    'Preferred machine-readable entry points:',
    `- ${catalog.site.catalog_json} — structured catalog with template metadata, install commands, source URLs, and preview URLs`,
    `- ${catalog.site.agent_catalog} — markdown digest of the current catalog for agents and humans`,
    `- ${catalog.site.llms_txt} — this overview`,
    '',
    'Install rules:',
    '- Prefer the install_cmd value from catalog.json for deterministic installation.',
    '- Official Nano Banana built-ins use the short form: bananahub add nano-banana-hub/nanobanana/<template-id>',
    '- Generic nested templates may use: bananahub add owner/repo/path/to/template',
    '',
    'How to use BananaHub as an agent:',
    '- Read catalog.json first for discovery and ranking inputs.',
    '- Use template_url when the full template body is needed.',
    '- Use sample_image and sample_image_page_url for preview assets.',
    '- Avoid scraping homepage cards when machine files are available.',
    '',
    'Ecosystem links:',
    '- Nano Banana repository: https://github.com/nano-banana-hub/nanobanana',
    '- BananaHub CLI: https://www.npmjs.com/package/bananahub',
    '- Template system docs: https://github.com/nano-banana-hub/nanobanana/blob/main/references/template-system.md',
    '- Template format spec: https://github.com/nano-banana-hub/nanobanana/blob/main/references/template-format-spec.md',
    '',
    `Current catalog summary: ${catalog.summary.template_count} templates, ${catalog.summary.profile_count} profiles, ${catalog.summary.official_count} official templates.`,
    `Generated: ${catalog.generated}`
  ];

  return `${lines.join('\n')}\n`;
}

function buildAgentCatalog(catalog) {
  const lines = [
    '# BananaHub Agent Catalog',
    '',
    `Generated: ${catalog.generated}`,
    '',
    'Use `catalog.json` for structured access. This markdown file is a readable digest of the same catalog.',
    '',
    '## Entry Points',
    '',
    `- Site: ${catalog.site.url}`,
    `- Catalog JSON: ${catalog.site.catalog_json}`,
    `- llms.txt: ${catalog.site.llms_txt}`,
    '',
    '## Templates',
    ''
  ];

  for (const template of catalog.templates) {
    lines.push(`### ${template.id}`);
    lines.push(`- Title: ${template.title_en}${template.title && template.title !== template.title_en ? ` / ${template.title}` : ''}`);
    lines.push(`- Profile: ${template.profile}`);
    lines.push(`- Difficulty: ${template.difficulty}`);
    lines.push(`- Official: ${template.official ? 'yes' : 'no'}`);
    lines.push(`- Tags: ${template.tags.join(', ') || 'none'}`);
    lines.push(`- Description: ${template.description || 'No description provided.'}`);
    lines.push(`- Install: \`${template.install_cmd}\``);
    lines.push(`- Template Source: ${template.template_url}`);
    if (template.sample_image) {
      lines.push(`- Preview Image: ${template.sample_image}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/${GENERATED_FILES.sitemap}\n`;
}

function buildSitemapXml(generatedAt) {
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/${GENERATED_FILES.catalog}`,
    `${SITE_URL}/${GENERATED_FILES.llms}`,
    `${SITE_URL}/${GENERATED_FILES.agentCatalog}`
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
  const generatedAt = new Date().toISOString();
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'BananaHub-Catalog-Builder/1.0'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    console.log('Using GITHUB_TOKEN for authentication.\n');
  } else {
    console.log('No GITHUB_TOKEN found. Using unauthenticated requests (60/hr limit).\n');
  }

  const templates = [];

  for (const repoConfig of source.repos) {
    console.log(`Processing repo: ${repoConfig.repo}`);
    const repoInfo = await fetchRepoInfo(repoConfig.repo, headers);
    const templateIds = await fetchTemplateIds(repoConfig.repo, repoConfig.path, headers);
    console.log(`  Found ${templateIds.length} templates: ${templateIds.join(', ')}\n`);

    for (const templateId of templateIds) {
      const content = await fetchTemplateContent(repoConfig.repo, repoInfo.default_branch, repoConfig.path, templateId, headers);
      if (!content) continue;

      const frontmatter = parseFrontmatter(content);
      if (!frontmatter) {
        console.error(`  No frontmatter in ${templateId}`);
        continue;
      }

      const template = buildTemplateRecord(repoConfig, repoInfo, templateId, frontmatter, content, generatedAt);
      templates.push(template);
      console.log(`  + ${template.id} (${template.profile}, ${template.difficulty})`);
    }

    console.log('');
  }

  templates.sort((left, right) => left.id.localeCompare(right.id, 'en'));

  const catalog = buildCatalog(source, templates, generatedAt);

  writeOutput(path.join(rootDir, GENERATED_FILES.catalog), `${JSON.stringify(catalog, null, 2)}\n`);
  writeOutput(path.join(rootDir, GENERATED_FILES.llms), buildLlmsTxt(catalog));
  writeOutput(path.join(rootDir, GENERATED_FILES.agentCatalog), buildAgentCatalog(catalog));
  writeOutput(path.join(rootDir, GENERATED_FILES.robots), buildRobotsTxt());
  writeOutput(path.join(rootDir, GENERATED_FILES.sitemap), buildSitemapXml(generatedAt));

  console.log(`Total templates: ${templates.length}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
