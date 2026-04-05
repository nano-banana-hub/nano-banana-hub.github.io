const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'bananahub-language';
const SUPPORTED_LANGUAGES = new Set(['en', 'zh-CN']);

const translations = {
  en: {
    common: {
      brandNote: 'for BananaHub Skill',
      skipToCatalog: 'Skip to catalog',
      skipToContent: 'Skip to content',
      primaryNav: 'Primary',
      languageSwitcher: 'Language',
      nav: {
        home: 'Home',
        catalog: 'Catalog',
        about: 'About',
        github: 'GitHub',
        agentFriendly: 'For Agents',
      },
      filter: {
        all: 'All',
      },
      source: {
        curated: 'Curated',
        discovered: 'Discovered',
      },
      distribution: {
        bundled: 'Built-in',
        remote: 'Installable',
      },
      profile: {
        general: 'General',
        photo: 'Photo',
        sticker: 'Sticker',
        product: 'Product',
        diagram: 'Diagram',
        minimal: 'Minimal',
        illustration: 'Illustration',
        'text-heavy': 'Text-heavy',
        '3d': '3D',
        'concept-art': 'Concept Art',
      },
      difficulty: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      type: {
        prompt: 'Prompt',
        workflow: 'Workflow',
      },
      badge: {
        pinned: 'Pinned',
        featured: 'Featured',
        official: 'Official',
        community: 'Community',
      },
      preview: {
        loading: 'Loading preview',
        unavailable: 'Preview unavailable',
        open: 'Open preview',
        source: 'Preview Source',
        openOriginal: 'Open original',
        previous: 'Previous sample',
        next: 'Next sample',
        sampleCount: '{current} / {total}',
      },
      template: {
        source: 'Template Source',
        noTags: 'No tags',
        noDescription: 'No description provided yet.',
      },
      action: {
        close: 'Close',
        copy: 'Copy',
        copied: 'Copied',
        copyInstall: 'Copy command',
        source: 'Source',
      },
      value: {
        unknown: 'Unknown',
        unavailable: 'Unavailable',
        na: 'n/a',
        notDeclared: 'Not declared',
        loading: 'Loading',
      },
      aria: {
        openDetails: 'Open details for {title}',
        previewUnavailable: '{title} preview unavailable',
      },
      results: {
        templateCount: '{count} templates',
        singleTemplateCount: '{count} template',
        profileCount: '{count} profiles',
        singleProfileCount: '{count} profile',
        sortedByRecommended: 'sorted by recommended order',
        sortedByTrending: 'sorted by 24h trend',
        filteredBy: 'filtered by {details}',
        query: 'query "{value}"',
        source: 'source {value}',
        profile: 'profile {value}',
        difficulty: 'difficulty {value}',
        noMatch: 'No templates match the current search and filter combination.',
        shareableHint: 'The current gallery view is encoded in the URL, so you can share this exact filter state.',
        defaultHint: 'Click a card for the full brief, then copy the primary command. Catalog refreshed {date} UTC.',
        loadFailedSummary: 'The catalog could not be loaded.',
        loadFailedHint: 'Refresh the page or open catalog.json directly to inspect the generated catalog.',
      },
      card: {
        installs24h: '{count} installs / 24h',
        uses24h: '{count} successful runs / 24h',
        installs: 'installs',
        successfulRuns: 'successful runs',
        installCountAria: '{count} installs total',
        successCountAria: '{count} successful runs total',
        noInstallNeeded: 'no install needed',
        bundledAria: 'Built into BananaHub Skill, no installation required',
      },
      empty: {
        loadFailedTitle: 'Failed to load templates.',
        loadFailedBody: 'Please refresh the page or open catalog.json directly.',
        noMatchTitle: 'No templates match the current view.',
        noMatchBody: 'Try removing a filter, switching sort mode, or resetting the search.',
      },
    },
    index: {
      meta: {
        title: 'BananaHub | Template Catalog for BananaHub Skill',
        description: "Browse built-in starter templates and installable remote templates for BananaHub Skill, compare generated looks, and use the right module for the current job.",
        ogTitle: 'BananaHub | Template Catalog for BananaHub Skill',
        ogDescription: 'A visual gallery of built-in starter templates and installable remote templates for BananaHub Skill.',
      },
      hero: {
        eyebrow: 'Starter + Remote',
        title: 'Browse templates for BananaHub Skill.',
        lead: 'Start with bundled starter templates, then install remote modules only when they add value.',
        metrics: {
          indexedTemplates: 'templates',
          profilesCovered: 'profiles',
          lastRebuild: 'last rebuild',
        },
        actions: {
          browseTemplates: 'Browse templates',
          browseGitHub: 'Browse GitHub',
          about: 'About BananaHub',
        },
        note: 'This is a gallery of reusable modules, not a giant prompt dump. It mixes the built-in starter pack with installable remote templates.',
      },
      catalog: {
        kicker: 'Live Catalog',
        title: 'A searchable gallery of starter and remote templates',
        status: {
          shown: 'shown',
          curated: 'curated',
          discovered: 'discovered',
        },
      },
      quickstart: {
        kicker: 'Quick Start',
        title: 'Install BananaHub Skill before browsing deeper.',
        lead: 'Use one install path for your environment, then run setup once and come back to the catalog when you need templates.',
        paths: {
          openAgentSkills: 'Open Agent Skills',
          claudeCode: 'Claude Code',
          firstRun: 'Run setup once',
        },
      },
      filters: {
        search: 'Search',
        searchPlaceholder: 'Search by template name, type, tag, profile, author, or intent in English or Chinese',
        source: 'Source',
        sourceAria: 'Filter by source layer',
        profile: 'Profile',
        difficulty: 'Difficulty',
        sort: 'Sort',
        sortAria: 'Sort templates',
        mostInstalled: 'Recommended',
        trending24h: 'Trending 24h',
        reset: 'Reset filters',
      },
      agent: {
        kicker: 'For Agents',
        title: 'Machine-readable catalog endpoints',
        lead: 'Fetch these files instead of parsing HTML. They stay in sync with the gallery above.',
        installPattern: 'Command patterns',
      },
      footer: {
        copy: 'Template catalog for BananaHub Skill, with stable files for machine-readable access when needed.',
        templateSystem: 'Template System',
        submitTemplate: 'Submit Template',
        meta: 'BananaHub keeps the runtime lean and distributes reusable templates across the broader BananaHub stack.',
      },
      modal: {
        kicker: 'Template Brief',
        author: 'Author',
        license: 'License',
        version: 'Version',
        aspect: 'Aspect',
        updated: 'Updated',
        distribution: 'Distribution',
        successfulRuns: 'Successful runs',
        installs: 'Installs',
        installs24h: '24h installs',
        installCommand: 'Primary command',
        viewFullImage: 'View full image',
      },
      lightbox: {
        close: 'Close full image',
      },
      structuredData: {
        pageDescription: 'Built-in starter and installable template catalog for BananaHub Skill.',
        catalogName: 'BananaHub Catalog',
        catalogDescription: 'Catalog of {count} built-in starter and installable remote templates for BananaHub Skill.',
      },
    },
    about: {
      meta: {
        title: 'About BananaHub | Starter Pack and Template Network for BananaHub Skill',
        description: 'Learn how BananaHub works as the built-in starter pack and installable template network for BananaHub Skill.',
        ogTitle: 'About BananaHub | Starter Pack and Template Network for BananaHub Skill',
        ogDescription: 'What BananaHub is, why it exists, and how humans, authors, and agents should use the built-in starter pack and installable template network.',
      },
      hero: {
        eyebrow: 'About BananaHub',
        title: 'The starter pack and template network for BananaHub Skill.',
        lead: 'BananaHub Skill is the agent-native runtime for guided Gemini image generation in chat. BananaHub bundles a small starter pack and adds a searchable, installable, machine-readable layer for everything else. Its workflow design is grounded in official Gemini image-generation guidance and refined into a practical agent workflow.',
        actions: {
          openGallery: 'Open gallery',
          templateSystem: 'Template System',
          templateFormat: 'Template Format',
        },
        note: 'Humans should usually start in the gallery. Agents should prefer `llms.txt`, `catalog.json`, and `agent-catalog.md`.',
      },
      manifesto: {
        kicker: 'What BananaHub Is',
        title: 'Not a prompt dump. A distribution layer for reusable templates.',
        lead: 'BananaHub exists so BananaHub Skill can ship a tight starter set while reusable prompt and workflow structures remain searchable, installable, and portable across repositories.',
      },
      principles: {
        first: {
          title: 'Agent-native first',
          body: 'The skill owns the conversation, constraint extraction, clarification, and iteration. BananaHub should plug into that workflow, not replace it with a separate prompt-builder maze.',
        },
        second: {
          title: 'Progressive disclosure over overload',
          body: 'Users should see only enough structure to make the next good decision: gallery first, template details on demand, full source only when it is needed.',
        },
        third: {
          title: 'Searchable, installable, machine-readable',
          body: 'Templates should be discoverable by humans, installable by CLI, and readable by agents from stable files without scraping the website UI.',
        },
      },
      machineFiles: {
        kicker: 'Machine Files',
        title: 'Use these files directly for automation.',
        lead: 'They mirror the public catalog and are the preferred interface for agents, scripts, and workflow tooling.',
        installPattern: 'Command patterns',
      },
      contribute: {
        kicker: 'Contribution Loop',
        title: 'A decentralized template network, not a monolithic prompt library.',
        authors: {
          title: 'For template authors',
          body: 'Publish self-describing template folders in GitHub, follow the BananaHub template format, and get indexed through the catalog source. Your modules stay portable in your repo; BananaHub stays lightweight.',
          link: 'Read the template spec',
        },
        agents: {
          title: 'For advanced users and agents',
          body: 'Use the catalog to detect a likely match, inspect the source template when needed, and install only the exact module that improves the current task.',
          link: 'Open the bananahub CLI',
        },
      },
      footer: {
        copy: 'Template catalog for BananaHub Skill, with stable files for machine-readable access when needed.',
        templateSystem: 'Template System',
        meta: 'BananaHub keeps the runtime lean and distributes reusable templates across the broader BananaHub stack.',
      },
    },
  },
  'zh-CN': {
    common: {
      brandNote: 'BananaHub Skill 模板站',
      skipToCatalog: '跳到模板列表',
      skipToContent: '跳到正文',
      primaryNav: '主导航',
      languageSwitcher: '切换语言',
      nav: {
        home: '首页',
        catalog: '模板',
        about: '关于',
        github: 'GitHub',
        agentFriendly: 'Agent 入口',
      },
      filter: {
        all: '全部',
      },
      source: {
        curated: '精选',
        discovered: '社区',
      },
      distribution: {
        bundled: '内置',
        remote: '可安装',
      },
      profile: {
        general: '通用',
        photo: '摄影',
        sticker: '贴纸',
        product: '产品',
        diagram: '图表',
        minimal: '极简',
        illustration: '插画',
        'text-heavy': '文字排版',
        '3d': '3D',
        'concept-art': '概念艺术',
      },
      difficulty: {
        beginner: '入门',
        intermediate: '进阶',
        advanced: '高级',
      },
      type: {
        prompt: 'Prompt',
        workflow: 'Workflow',
      },
      badge: {
        pinned: '置顶',
        featured: '推荐',
        official: '官方',
        community: '社区',
      },
      preview: {
        loading: '加载预览中',
        unavailable: '暂无预览',
        open: '查看预览',
        source: '预览来源',
        openOriginal: '看原图',
        previous: '上一张样张',
        next: '下一张样张',
        sampleCount: '{current} / {total}',
      },
      template: {
        source: '模板源码',
        noTags: '没有标签',
        noDescription: '还没有描述。',
      },
      action: {
        close: '关闭',
        copy: '复制',
        copied: '已复制',
        copyInstall: '复制命令',
        source: '源码',
      },
      value: {
        unknown: '未知',
        unavailable: '暂无',
        na: '—',
        notDeclared: '未声明',
        loading: '加载中',
      },
      aria: {
        openDetails: '查看 {title} 详情',
        previewUnavailable: '{title} 暂无预览',
      },
      results: {
        templateCount: '{count} 个模板',
        singleTemplateCount: '{count} 个模板',
        profileCount: '{count} 个分类',
        singleProfileCount: '{count} 个分类',
        sortedByRecommended: '按推荐顺序排序',
        sortedByTrending: '按 24h 热度排序',
        filteredBy: '当前筛选：{details}',
        query: '搜索「{value}」',
        source: '来源 {value}',
        profile: '分类 {value}',
        difficulty: '难度 {value}',
        noMatch: '没找到匹配的模板，换个条件试试。',
        shareableHint: '当前筛选状态已写入 URL，直接分享链接就行。',
        defaultHint: '点卡片看详情，再复制对应主命令。最后更新：{date} UTC。',
        loadFailedSummary: '加载失败了。',
        loadFailedHint: '刷新页面试试，或者直接打开 catalog.json 看原始数据。',
      },
      card: {
        installs24h: '24h 安装 {count} 次',
        uses24h: '24h 成功生成 {count} 次',
        installs: '安装量',
        successfulRuns: '成功生成',
        installCountAria: '累计 {count} 次安装',
        successCountAria: '累计成功生成 {count} 次',
        noInstallNeeded: '无需安装',
        bundledAria: 'BananaHub Skill 已内置，无需安装',
      },
      empty: {
        loadFailedTitle: '模板没加载出来。',
        loadFailedBody: '刷新一下，或者直接打开 catalog.json。',
        noMatchTitle: '没有匹配的模板。',
        noMatchBody: '去掉几个筛选条件，或者换个关键词再搜。',
      },
    },
    index: {
      meta: {
        title: 'BananaHub — BananaHub Skill 模板库',
        description: '浏览 BananaHub Skill 的内置起步模板和可安装远程模板，预览效果图，再用对当前任务最合适的模块。',
        ogTitle: 'BananaHub — BananaHub Skill 模板库',
        ogDescription: 'BananaHub Skill 的模板画廊，内置起步模板和可安装远程模板一起看。',
      },
      hero: {
        eyebrow: '内置 + 远程',
        title: '找模板、看效果、直接调用。',
        lead: '先用 Skill 自带的起步模板，不够时再安装远程模块。',
        metrics: {
          indexedTemplates: '个模板',
          profilesCovered: '个分类',
          lastRebuild: '上次更新',
        },
        actions: {
          browseTemplates: '看模板',
          browseGitHub: 'GitHub',
          about: '了解更多',
        },
        note: '这是模板库，不是 prompt 大杂烩。这里同时收录 Skill 内置起步模板和可安装远程模板。',
      },
      catalog: {
        kicker: '实时目录',
        title: '内置与远程模板画廊',
        status: {
          shown: '当前显示',
          curated: '精选',
          discovered: '社区',
        },
      },
      quickstart: {
        kicker: '快速开始',
        title: '先装 BananaHub Skill，再继续挑模板。',
        lead: '按你的环境选一种安装方式，装好后先跑一次初始化，再回来挑模板。',
        paths: {
          openAgentSkills: 'Open Agent Skills',
          claudeCode: 'Claude Code',
          firstRun: '首次初始化',
        },
      },
      filters: {
        search: '搜索',
        searchPlaceholder: '搜模板名、标签、分类、作者……中英文都行',
        source: '来源',
        sourceAria: '按来源筛选',
        profile: '分类',
        difficulty: '难度',
        sort: '排序',
        sortAria: '排序方式',
        mostInstalled: '推荐顺序',
        trending24h: '24h 热门',
        reset: '重置',
      },
      agent: {
        kicker: 'Agent 入口',
        title: '机器可读的目录接口',
        lead: '直接请求这些文件，不用解析 HTML，数据和上面的画廊同步。',
        installPattern: '命令格式',
      },
      footer: {
        copy: 'BananaHub Skill 的模板画廊，同时提供机器可读的数据接口。',
        templateSystem: '模板系统',
        submitTemplate: '提交模板',
        meta: 'BananaHub 把模板从 Skill 里拆出来单独管理，保持核心轻量。',
      },
      modal: {
        kicker: '模板详情',
        author: '作者',
        license: '许可证',
        version: '版本',
        aspect: '比例',
        updated: '更新时间',
        distribution: '分发方式',
        successfulRuns: '成功生成',
        installs: '安装量',
        installs24h: '24h 安装',
        installCommand: '主命令',
        viewFullImage: '查看大图',
      },
      lightbox: {
        close: '关闭大图',
      },
      structuredData: {
        pageDescription: 'BananaHub Skill 的内置与可安装模板目录。',
        catalogName: 'BananaHub 模板目录',
        catalogDescription: '收录了 {count} 个 BananaHub 内置与可安装模板。',
      },
    },
    about: {
      meta: {
        title: '关于 BananaHub — BananaHub Skill 起步模板与模板网络',
        description: 'BananaHub 是什么，怎么用，以及它和 BananaHub Skill 内置起步模板的关系。',
        ogTitle: '关于 BananaHub — BananaHub Skill 起步模板与模板网络',
        ogDescription: 'BananaHub 既是 BananaHub Skill 的内置起步模板集合，也是可安装模板网络。',
      },
      hero: {
        eyebrow: '关于 BananaHub',
        title: 'BananaHub Skill 的起步模板与模板网络。',
        lead: 'BananaHub Skill 负责在对话里引导 Gemini 生图，BananaHub 一方面提供一小套内置起步模板，另一方面负责把其余模板管起来——搜得到、装得上、机器也能直接读。这套工作流设计基于官方 Gemini 图像生成指引提炼，再封装成更适合 agent 使用的实践形式。',
        actions: {
          openGallery: '去画廊',
          templateSystem: '模板系统',
          templateFormat: '模板格式',
        },
        note: '普通用户直接逛画廊就好。Agent 请读 `llms.txt`、`catalog.json`、`agent-catalog.md`。',
      },
      manifesto: {
        kicker: 'BananaHub 是什么',
        title: '模板的分发层，不是 prompt 堆放站。',
        lead: '让 BananaHub Skill 只内置一套紧凑的起步模板，其余模板继续保持可搜索、可安装、可跨仓库复用。',
      },
      principles: {
        first: {
          title: 'Agent 优先',
          body: 'Skill 管对话和引导，BananaHub 只管模板分发，不搞另一套 prompt 编辑器。',
        },
        second: {
          title: '按需展开',
          body: '先看画廊挑模板，需要的时候再看详情，没必要一上来就全摊开。',
        },
        third: {
          title: '搜得到、装得上、读得了',
          body: '人能搜、CLI 能装、Agent 能从文件里直接读，不用去爬网页。',
        },
      },
      machineFiles: {
        kicker: '机器文件',
        title: '自动化直接用这些。',
        lead: '跟画廊数据同步，Agent 和脚本优先用这几个文件。',
        installPattern: '命令格式',
      },
      contribute: {
        kicker: '参与贡献',
        title: '去中心化的模板网络，不是单体大仓库。',
        authors: {
          title: '模板作者',
          body: '在你自己的 GitHub 仓库里发布模板，按 BananaHub 模板格式写好，提交到 catalog source 就能被收录。模板在你的仓库里，BananaHub 只做索引。',
          link: '看模板规范',
        },
        agents: {
          title: '开发者和 Agent',
          body: '用目录找模板，看源码确认细节，只装你需要的那个。',
          link: '打开 bananahub CLI',
        },
      },
      footer: {
        copy: 'BananaHub Skill 的模板画廊，同时提供机器可读的数据接口。',
        templateSystem: '模板系统',
        meta: 'BananaHub 把模板从运行时里拆出来单独管理，保持核心轻量。',
      },
    },
  },
};

let currentLanguage = DEFAULT_LANGUAGE;
const listeners = new Set();

function resolveTranslation(language, key) {
  return key.split('.').reduce((acc, part) => (acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined), translations[language]);
}

function interpolate(template, replacements) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');
}

export function normalizeLanguage(value) {
  const input = String(value || '').trim().toLowerCase();
  if (!input) {
    return DEFAULT_LANGUAGE;
  }

  if (input === 'zh' || input === 'zh-cn' || input === 'zh-hans' || input.startsWith('zh-')) {
    return 'zh-CN';
  }

  return 'en';
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function getCurrentLocale() {
  return currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US';
}

export function t(key, replacements = {}, fallback = key) {
  const value = resolveTranslation(currentLanguage, key)
    ?? resolveTranslation(DEFAULT_LANGUAGE, key)
    ?? fallback;
  return interpolate(value, replacements);
}

export function translateEnum(group, value, fallback = value) {
  return t(`common.${group}.${value}`, {}, fallback);
}

function readLanguageFromStorage() {
  try {
    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function readLanguageFromUrl() {
  const url = new URL(window.location.href);
  const lang = url.searchParams.get('lang');
  return lang ? normalizeLanguage(lang) : '';
}

function getInitialLanguage() {
  const urlLanguage = readLanguageFromUrl();
  if (urlLanguage) {
    return urlLanguage;
  }

  try {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (storedLanguage) {
      return normalizeLanguage(storedLanguage);
    }
  } catch {
    // Ignore storage errors.
  }

  return normalizeLanguage(window.navigator.language || DEFAULT_LANGUAGE);
}

function syncDocumentLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.setAttribute('data-language', currentLanguage);
}

function syncLanguageButtons(root = document) {
  root.querySelectorAll('[data-lang-switch]').forEach((button) => {
    const isActive = normalizeLanguage(button.dataset.langSwitch) === currentLanguage;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateLanguageInUrl() {
  const url = new URL(window.location.href);
  if (currentLanguage === DEFAULT_LANGUAGE) {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', currentLanguage);
  }
  window.history.replaceState(null, '', url);
}

function notifyLanguageChange() {
  listeners.forEach((listener) => listener(currentLanguage));
}

export function applyPageTranslations(page, root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });

  root.querySelectorAll('[data-i18n-content]').forEach((element) => {
    element.setAttribute('content', t(element.dataset.i18nContent));
  });

  syncDocumentLanguage();
  syncLanguageButtons(root);

  if (page === 'index' && document.title !== t('index.meta.title')) {
    document.title = t('index.meta.title');
  }

  if (page === 'about' && document.title !== t('about.meta.title')) {
    document.title = t('about.meta.title');
  }
}

export function initI18n({ page } = {}) {
  currentLanguage = getInitialLanguage();
  syncDocumentLanguage();
  if (page) {
    applyPageTranslations(page);
  } else {
    syncLanguageButtons();
  }

  document.querySelectorAll('[data-lang-switch]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextLanguage = normalizeLanguage(button.dataset.langSwitch);
      if (nextLanguage === currentLanguage) {
        return;
      }

      currentLanguage = nextLanguage;
      try {
        window.localStorage.setItem(STORAGE_KEY, currentLanguage);
      } catch {
        // Ignore storage errors.
      }
      updateLanguageInUrl();
      if (page) {
        applyPageTranslations(page);
      } else {
        syncDocumentLanguage();
        syncLanguageButtons();
      }
      notifyLanguageChange();
    });
  });
}

export function syncLanguageFromLocation(page) {
  const urlLanguage = readLanguageFromUrl();
  const nextLanguage = urlLanguage || readLanguageFromStorage();
  const normalized = normalizeLanguage(nextLanguage);
  if (normalized === currentLanguage) {
    return false;
  }

  currentLanguage = normalized;
  if (page) {
    applyPageTranslations(page);
  } else {
    syncDocumentLanguage();
    syncLanguageButtons();
  }
  notifyLanguageChange();
  return true;
}

export function subscribeLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
