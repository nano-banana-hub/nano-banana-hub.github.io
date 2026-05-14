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
      utility: {
        githubStarsAria: 'Open the BananaHub Skill repository on GitHub and view its current star count',
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
        provider: 'provider {value}',
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
        recommended: 'Recommended',
        models: 'Models',
        providers: 'Providers',
        showSupport: 'Show support',
        hideSupport: 'Hide support',
        modelsCount: '{count} models',
        providersCount: '{count} providers',
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
        provider: 'Provider',
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
        recommended: 'Recommended',
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
          agentInit: 'Agent Init',
          templateSystem: 'Template System',
          templateFormat: 'Template Format',
        },
        note: 'Humans should usually start in the gallery. Agents should start with `agent-init.md` when setup is incomplete, then use `llms.txt`, `catalog.json`, and `agent-catalog.md`.',
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
      brandNote: 'BananaHub Skill 模板库',
      skipToCatalog: '跳到模板区',
      skipToContent: '跳到正文',
      primaryNav: '主导航',
      languageSwitcher: '切换语言',
      nav: {
        home: '首页',
        catalog: '模板',
        about: '关于',
        github: 'GitHub',
        agentFriendly: '给 Agent',
      },
      utility: {
        githubStarsAria: '打开 BananaHub Skill 的 GitHub 仓库并查看当前星标数量',
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
        prompt: '提示词',
        workflow: '工作流',
      },
      badge: {
        pinned: '置顶',
        featured: '推荐',
        official: '官方',
        community: '社区',
      },
      preview: {
        loading: '预览加载中',
        unavailable: '暂无预览',
        open: '查看预览',
        source: '样图来源',
        openOriginal: '查看原图',
        previous: '上一张',
        next: '下一张',
        sampleCount: '{current} / {total}',
      },
      template: {
        source: '模板源码',
        noTags: '暂无标签',
        noDescription: '暂时还没有说明。',
      },
      action: {
        close: '关闭',
        copy: '复制',
        copied: '已复制',
        copyInstall: '复制命令',
        source: '查看源码',
      },
      value: {
        unknown: '未知',
        unavailable: '暂无',
        na: '—',
        notDeclared: '未声明',
        loading: '加载中',
      },
      aria: {
        openDetails: '查看 {title} 的详情',
        previewUnavailable: '{title} 暂无预览',
      },
      results: {
        templateCount: '{count} 个模板',
        singleTemplateCount: '{count} 个模板',
        profileCount: '{count} 个分类',
        singleProfileCount: '{count} 个分类',
        sortedByRecommended: '按推荐顺序显示',
        sortedByTrending: '按近 24 小时热度显示',
        filteredBy: '筛选条件：{details}',
        query: '搜索「{value}」',
        source: '来源：{value}',
        profile: '分类：{value}',
        difficulty: '难度：{value}',
        provider: '供应商：{value}',
        noMatch: '没找到符合条件的模板，换个关键词或筛选试试。',
        shareableHint: '当前筛选会同步到 URL，直接复制链接就能分享。',
        defaultHint: '点开卡片看详情，再复制主命令即可。目录更新于 {date} UTC。',
        loadFailedSummary: '目录加载失败。',
        loadFailedHint: '刷新页面试试，或者直接打开 catalog.json 查看原始数据。',
      },
      card: {
        installs24h: '近 24 小时安装 {count} 次',
        uses24h: '近 24 小时成功生成 {count} 次',
        installs: '安装量',
        successfulRuns: '成功生成',
        installCountAria: '累计安装 {count} 次',
        successCountAria: '累计成功生成 {count} 次',
        noInstallNeeded: '无需安装',
        bundledAria: 'BananaHub Skill 已内置，无需额外安装',
        recommended: '推荐模型',
        models: '支持模型',
        providers: '支持供应商',
        showSupport: '展开支持范围',
        hideSupport: '收起支持范围',
        modelsCount: '{count} 个模型',
        providersCount: '{count} 个供应商',
      },
      empty: {
        loadFailedTitle: '模板加载失败。',
        loadFailedBody: '请刷新页面，或直接打开 catalog.json 查看数据。',
        noMatchTitle: '没有找到匹配的模板。',
        noMatchBody: '试试减少筛选条件，或换个关键词搜索。',
      },
    },
    index: {
      meta: {
        title: 'BananaHub — BananaHub Skill 模板库',
        description: '浏览 BananaHub Skill 的内置起步模板和可安装远程模板，先看样图，再挑最适合当前任务的模板。',
        ogTitle: 'BananaHub — BananaHub Skill 模板库',
        ogDescription: '一个汇总 BananaHub Skill 内置模板与可安装远程模板的可视化模板库。',
      },
      hero: {
        eyebrow: '内置 + 远程',
        title: '挑模板、看效果、直接开用。',
        lead: '先从 Skill 自带的起步模板开始，不够用时再安装远程模板。',
        metrics: {
          indexedTemplates: '个模板',
          profilesCovered: '个分类',
          lastRebuild: '最近更新',
        },
        actions: {
          browseTemplates: '浏览模板',
          browseGitHub: '查看 GitHub',
          about: '了解 BananaHub',
        },
        note: '这里是可复用模板库，不是把一堆 prompt 生硬堆在一起。内置起步模板和可安装远程模板都会收录在这里。',
      },
      catalog: {
        kicker: '实时目录',
        title: '可搜索的内置与远程模板库',
        status: {
          shown: '当前显示',
          curated: '精选',
          discovered: '社区',
        },
      },
      quickstart: {
        kicker: '快速开始',
        title: '先安装 BananaHub Skill，再慢慢挑模板。',
        lead: '按你的环境选一种安装方式，初始化一次后，之后需要模板时再回来这里找。',
        paths: {
          openAgentSkills: 'Open Agent Skills',
          claudeCode: 'Claude Code',
          firstRun: '首次初始化',
        },
      },
      filters: {
        search: '搜索',
        searchPlaceholder: '按模板名、类型、标签、分类、作者或用途搜索，中英文都支持',
        source: '来源',
        sourceAria: '按来源筛选',
        profile: '分类',
        difficulty: '难度',
        provider: '供应商',
        sort: '排序',
        sortAria: '模板排序方式',
        mostInstalled: '推荐优先',
        trending24h: '24 小时热门',
        reset: '重置筛选',
      },
      agent: {
        kicker: '给 Agent',
        title: '机器可直接读取的目录文件',
        lead: '直接请求这些文件，不用解析 HTML；它们会和上面的模板库保持同步。',
        installPattern: '命令示例',
      },
      footer: {
        copy: 'BananaHub Skill 的模板库，同时提供稳定的机器可读文件接口。',
        templateSystem: '模板系统',
        submitTemplate: '提交模板',
        meta: 'BananaHub 把可复用模板从运行时里拆出来管理，让核心保持轻量。',
      },
      modal: {
        kicker: '模板详情',
        author: '作者',
        license: '许可证',
        version: '版本',
        aspect: '比例',
        updated: '更新时间',
        recommended: '推荐模型',
        distribution: '分发方式',
        successfulRuns: '成功生成',
        installs: '安装量',
        installs24h: '24 小时安装',
        installCommand: '主命令',
        viewFullImage: '查看大图',
      },
      lightbox: {
        close: '关闭大图',
      },
      structuredData: {
        pageDescription: 'BananaHub Skill 的内置起步模板与可安装模板目录。',
        catalogName: 'BananaHub 模板库',
        catalogDescription: '收录了 {count} 个 BananaHub Skill 内置起步模板与可安装远程模板。',
      },
    },
    about: {
      meta: {
        title: '关于 BananaHub — BananaHub Skill 的起步模板与模板网络',
        description: '了解 BananaHub 是什么、为什么会有它，以及它和 BananaHub Skill 内置起步模板之间的关系。',
        ogTitle: '关于 BananaHub — BananaHub Skill 的起步模板与模板网络',
        ogDescription: 'BananaHub 是什么、为什么存在，以及普通用户、模板作者和 Agent 应该怎么使用这套模板网络。',
      },
      hero: {
        eyebrow: '关于 BananaHub',
        title: 'BananaHub Skill 的起步模板集合，也是模板网络。',
        lead: 'BananaHub Skill 负责在对话里引导 Gemini 生图；BananaHub 则提供一小套内置起步模板，并把其他模板整理成可搜索、可安装、可机读的一层。整套工作流基于官方 Gemini 图像生成指引，再打磨成更适合 agent 使用的方式。',
        actions: {
          openGallery: '查看模板库',
          agentInit: 'Agent 初始化',
          templateSystem: '模板系统',
          templateFormat: '模板格式',
        },
        note: '普通用户一般从模板库开始就够了。如果还没完成安装和密钥配置，Agent 应先读 `agent-init.md`，之后再读 `llms.txt`、`catalog.json` 和 `agent-catalog.md`。',
      },
      manifesto: {
        kicker: 'BananaHub 是什么',
        title: '它不是 prompt 堆放站，而是可复用模板的分发层。',
        lead: '这样 BananaHub Skill 可以只内置一套精简的起步模板，而可复用的提示词和工作流结构仍然能被搜索、安装，并在不同仓库之间迁移。',
      },
      principles: {
        first: {
          title: '优先服务 Agent 工作流',
          body: '对话引导、约束提取、补充澄清和迭代都应该由 Skill 来负责；BananaHub 要做的是接入这条流程，而不是再造一个独立的 prompt 编辑器。',
        },
        second: {
          title: '循序展开，而不是信息轰炸',
          body: '用户只需要看到下一步决策所需的信息：先看模板库，需要时再展开模板详情，只有真的要深挖时才去读完整源码。',
        },
        third: {
          title: '搜得到、装得上、机读友好',
          body: '模板应该方便人来搜索，方便 CLI 安装，也方便 Agent 从稳定文件中直接读取，不必去抓取网页界面。',
        },
      },
      machineFiles: {
        kicker: '机器文件',
        title: '做自动化时，直接用这些文件。',
        lead: '它们和公开模板库保持同步，也是 Agent、脚本和工作流工具更推荐的接入方式。',
        installPattern: '命令示例',
      },
      contribute: {
        kicker: '参与方式',
        title: '这是去中心化的模板网络，不是一个越来越臃肿的大仓库。',
        authors: {
          title: '给模板作者',
          body: '把带自描述信息的模板目录发布到 GitHub，按 BananaHub 模板规范组织好，再接入 catalog source 即可被索引。模板继续留在你的仓库里，BananaHub 只负责发现和收录。',
          link: '查看模板规范',
        },
        agents: {
          title: '给进阶用户和 Agent',
          body: '先用目录找到合适候选，需要时再查看模板源码，只安装对当前任务真正有帮助的那一个模块。',
          link: '打开 bananahub CLI',
        },
      },
      footer: {
        copy: 'BananaHub Skill 的模板库，同时提供稳定的机器可读文件接口。',
        templateSystem: '模板系统',
        meta: 'BananaHub 把可复用模板从运行时里拆出来管理，让核心保持轻量。',
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
