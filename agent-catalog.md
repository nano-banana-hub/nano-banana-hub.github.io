# BananaHub Agent Catalog

Generated: 2026-05-15T08:45:18.908Z

BananaHub is the installable template network for BananaHub Skill.
Use `catalog.json` for structured access. This markdown file is a readable digest of the merged catalog.

## Entry Points

- Site: https://bananahub.ai/
- Agent Initialization JSON: https://bananahub.ai/agent-init.json
- Agent Initialization: https://bananahub.ai/agent-init.md
- Merged Catalog JSON: https://bananahub.ai/catalog.json
- Curated Catalog JSON: https://bananahub.ai/catalog-curated.json
- Discovered Catalog JSON: https://bananahub.ai/catalog-discovered.json
- llms.txt: https://bananahub.ai/llms.txt

## Curated Templates (14)

### app-web-logo-system
- Title: App and Web Logo Workflow / App/Web Logo 生成工作流
- Type: workflow
- Profile: text-heavy
- Difficulty: intermediate
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: logo, app图标, web logo, favicon, 品牌标识, icon, wordmark, maskable
- Description: Guide the agent through building a usable app and web logo system: first lock the brand idea and the most restrictive platform constraints, then generate an icon-first mark, then derive web lockups and platform-safe variants without letting the concept drift.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/app-web-logo-system`
- Install Command: `bananahub add bananahub-ai/templates/app-web-logo-system`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=app-web-logo-system
- Template Source: https://github.com/bananahub-ai/templates/tree/main/app-web-logo-system
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/app-web-logo-system/samples/sample-3-pro-01.png

### article-illustration-workflow
- Title: Article Illustration Workflow / 文章配图工作流
- Type: workflow
- Profile: diagram
- Difficulty: intermediate
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 文章配图, 文章插图, 博客配图, 教程配图, blog, article, editorial, tutorial, docs, explainer
- Description: Guide the agent through turning an article, tutorial, or one important paragraph into a compact illustration pack: read the source first, decide which sections deserve images, write a small outline, then generate visuals that clarify the article instead of decorating it.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/article-illustration-workflow`
- Install Command: `bananahub add bananahub-ai/templates/article-illustration-workflow`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=article-illustration-workflow
- Template Source: https://github.com/bananahub-ai/templates/tree/main/article-illustration-workflow
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/article-illustration-workflow/samples/sample-3-pro-01.png

### article-one-page-summary
- Title: Article One-Page Visual Summary / 文章一图流解读
- Type: workflow
- Profile: diagram
- Difficulty: intermediate
- Source Layer: curated
- Distribution: bundled
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 文章解读, 一图流, 长文总结, 知识卡片, article, summary, infographic, one-pager
- Description: Turn an article, memo, transcript, or long note into one accurate visual summary. The workflow protects facts first, then compresses the message into a readable one-page infographic.
- Primary Action: use
- Primary Command: `/bananahub use article-one-page-summary`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Fbananahub-skill&template_id=article-one-page-summary
- Template Source: https://github.com/bananahub-ai/bananahub-skill/tree/main/references/templates/article-one-page-summary

### asset-style-consistency-pack
- Title: Local Asset Style Consistency Workflow / 本地素材风格统一工作流
- Type: workflow
- Profile: general
- Difficulty: advanced
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 素材包, 风格统一, 多图一致性, reference, batch, consistency, edit
- Description: Guide the agent through creating a consistent asset pack from local images: first lock one approved style anchor, then propagate the same style and constraints across additional assets without letting color, composition logic, or character identity drift.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/asset-style-consistency-pack`
- Install Command: `bananahub add bananahub-ai/templates/asset-style-consistency-pack`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=asset-style-consistency-pack
- Template Source: https://github.com/bananahub-ai/templates/tree/main/asset-style-consistency-pack
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/asset-style-consistency-pack/samples/sample-3-pro-01.png

### background-replace-edit
- Title: Background Replacement Edit / 背景替换编辑
- Type: prompt
- Profile: photo
- Difficulty: beginner
- Source Layer: curated
- Distribution: bundled
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 背景替换, 图片编辑, 商品编辑, 人像编辑, background, edit, retouch
- Description: 用于已有图片的背景替换。核心原则是主体、姿态、产品结构、文字和关键边缘尽量不动，只改变环境、光线和氛围。
- Primary Action: use
- Primary Command: `/bananahub use background-replace-edit`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Fbananahub-skill&template_id=background-replace-edit
- Template Source: https://github.com/bananahub-ai/bananahub-skill/tree/main/references/templates/background-replace-edit

### consistent-character-storyboard
- Title: Consistent Character Storyboard Workflow / 角色一致性分镜工作流
- Type: workflow
- Profile: general
- Difficulty: intermediate
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 分镜, 角色一致性, 故事板, storyboard, contact-sheet, multi-shot
- Description: Guide the agent through a repeatable storyboard exploration workflow: first lock a master character reference, then explore multi-shot boards, then iterate with single-variable edits so the character stays consistent across frames without overcommitting too early to a final story layout.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/consistent-character-storyboard`
- Install Command: `bananahub add bananahub-ai/templates/consistent-character-storyboard`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=consistent-character-storyboard
- Template Source: https://github.com/bananahub-ai/templates/tree/main/consistent-character-storyboard
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/consistent-character-storyboard/samples/sample-3-pro-01.png

### cute-sticker
- Title: Cute Chibi Sticker Pack / Q版贴纸表情包
- Type: prompt
- Profile: sticker
- Difficulty: beginner
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 贴纸, 表情包, Q版, 可爱, chibi
- Description: 生成 Q 版可爱贴纸/表情包。大头小身、表情夸张、白色背景带描边，适合微信/Telegram 表情包或社交媒体贴纸。
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/cute-sticker`
- Install Command: `bananahub add bananahub-ai/templates/cute-sticker`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=cute-sticker
- Template Source: https://github.com/bananahub-ai/templates/tree/main/cute-sticker
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/cute-sticker/samples/sample-3.1-flash-01.png

### cyberpunk-city
- Title: Cyberpunk City Nightscape / 赛博朋克城市夜景
- Type: prompt
- Profile: photo
- Difficulty: beginner
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 赛博朋克, 城市, 夜景, 科幻, neon
- Description: 一键生成赛博朋克风格的城市夜景。霓虹灯光、雨水反射、未来感建筑，适合用作桌面壁纸、概念设定、社交媒体封面。
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/cyberpunk-city`
- Install Command: `bananahub add bananahub-ai/templates/cyberpunk-city`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=cyberpunk-city
- Template Source: https://github.com/bananahub-ai/templates/tree/main/cyberpunk-city
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/cyberpunk-city/samples/sample-3.1-flash-01.png

### github-repo-visual-kit
- Title: GitHub Repository Visual Kit / GitHub 仓库运营视觉套件
- Type: workflow
- Profile: diagram
- Difficulty: intermediate
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: GitHub, README, 仓库配图, 信息图, 部署指南, repo, infographic, deployment, hero
- Description: Create GitHub-ready visual assets from verified repository context: a README hero image for user attraction, a target-user infographic for fast understanding, or a deployment guide image for first successful use. Marketing clarity matters, but factual accuracy wins.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/github-repo-visual-kit`
- Install Command: `bananahub add bananahub-ai/templates/github-repo-visual-kit`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=github-repo-visual-kit
- Template Source: https://github.com/bananahub-ai/templates/tree/main/github-repo-visual-kit

### info-diagram
- Title: Practical Infographic One-Pager / 信息图一页卡
- Type: prompt
- Profile: diagram
- Difficulty: beginner
- Source Layer: curated
- Distribution: bundled
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 信息图, 一页图, 流程图, 知识卡片, infographic, diagram, one-pager
- Description: 生成稳定、实用的信息图一页卡。适合流程说明、概念拆解、对比图、时间线和教程摘要。目标不是炫技，而是让读者 10 秒内看懂结构。
- Primary Action: use
- Primary Command: `/bananahub use info-diagram`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Fbananahub-skill&template_id=info-diagram
- Template Source: https://github.com/bananahub-ai/bananahub-skill/tree/main/references/templates/info-diagram

### minimal-wallpaper
- Title: Minimal Phone Wallpaper / 极简手机壁纸
- Type: prompt
- Profile: minimal
- Difficulty: beginner
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 极简, 壁纸, 手机, 留白, 简约
- Description: 生成极简风格手机壁纸。大面积留白、单一主体、克制的配色，适合 iPhone/Android 锁屏和主屏壁纸。
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/minimal-wallpaper`
- Install Command: `bananahub add bananahub-ai/templates/minimal-wallpaper`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=minimal-wallpaper
- Template Source: https://github.com/bananahub-ai/templates/tree/main/minimal-wallpaper
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/minimal-wallpaper/samples/sample-3.1-flash-01.png

### product-white-bg
- Title: E-commerce Product Clean Shot / 电商白底产品图
- Type: prompt
- Profile: product
- Difficulty: beginner
- Source Layer: curated
- Distribution: bundled
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 产品图, 电商, 白底, 商品主图, catalog, ecommerce, product
- Description: 生成电商平台常用的白底产品图。重点是主体干净、材质可信、边缘完整、投影自然，适合主图、目录图、详情页首屏和内部选品物料。
- Primary Action: use
- Primary Command: `/bananahub use product-white-bg`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Fbananahub-skill&template_id=product-white-bg
- Template Source: https://github.com/bananahub-ai/bananahub-skill/tree/main/references/templates/product-white-bg

### readme-launch-visual
- Title: README Launch Visual Workflow / README 启动视觉工作流
- Type: workflow
- Profile: text-heavy
- Difficulty: intermediate
- Source Layer: curated
- Distribution: remote
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: README, 头图, 海报, 封面, OG, launch, hero, banner
- Description: Guide the agent through converting README or positioning text into one launch-ready visual with locked copy, a clear headline hierarchy, and a visual metaphor that matches the actual product instead of generic AI poster aesthetics.
- Primary Action: install
- Primary Command: `bananahub add bananahub-ai/templates/readme-launch-visual`
- Install Command: `bananahub add bananahub-ai/templates/readme-launch-visual`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Ftemplates&template_id=readme-launch-visual
- Template Source: https://github.com/bananahub-ai/templates/tree/main/readme-launch-visual
- Preview Image: https://raw.githubusercontent.com/bananahub-ai/templates/main/readme-launch-visual/samples/sample-3-pro-01.png

### repo-explainer-diagram
- Title: Repository Explainer Diagram / 代码库讲解图
- Type: workflow
- Profile: diagram
- Difficulty: intermediate
- Source Layer: curated
- Distribution: bundled
- License: CC-BY-4.0
- Official: yes
- Featured: no
- Pinned: no
- Tags: 代码库, 项目结构, 架构图, README, repo, codebase, architecture, explainer
- Description: Turn real repository context into one clear visual: project map, architecture diagram, request flow, setup flow, or contributor onboarding card. Accuracy beats decoration.
- Primary Action: use
- Primary Command: `/bananahub use repo-explainer-diagram`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=bananahub-ai%2Fbananahub-skill&template_id=repo-explainer-diagram
- Template Source: https://github.com/bananahub-ai/bananahub-skill/tree/main/references/templates/repo-explainer-diagram

## Discovered Templates (2)

### artisan-portrait
- Title: Environmental Artisan Portrait / 匠人环境人像
- Type: prompt
- Profile: photo
- Difficulty: beginner
- Source Layer: discovered
- Distribution: remote
- License: NOASSERTION
- Official: no
- Featured: no
- Pinned: no
- Tags: 人像, 摄影, 匠人, 工坊, portrait, artisan, workshop, editorial
- Description: 生成有明确职业身份、环境叙事和摄影语言的匠人人像。适合陶艺师、木工、花艺师、面包师、制表师等“人物 + 手上动作 + 工作空间”场景。
- Primary Action: install
- Primary Command: `bananahub add zkywalker/nanobanana-artisan-portrait`
- Install Command: `bananahub add zkywalker/nanobanana-artisan-portrait`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=zkywalker%2Fnanobanana-artisan-portrait&template_id=artisan-portrait
- Template Source: https://github.com/zkywalker/nanobanana-artisan-portrait/tree/main
- Preview Image: https://raw.githubusercontent.com/zkywalker/nanobanana-artisan-portrait/main/samples/sample-3-pro-01.png

### city-landmark-diorama
- Title: City Landmark Diorama Workflow / 城市地标沙盘工作流
- Type: workflow
- Profile: 3d
- Difficulty: intermediate
- Source Layer: discovered
- Distribution: remote
- License: NOASSERTION
- Official: no
- Featured: no
- Pinned: no
- Tags: 城市沙盘, 城市地标, 建筑模型, isometric, diorama, cityscape, landmark, miniature
- Description: Guide the agent through turning a city name or a mixed Chinese brief into a reusable English prompt for a premium square city diorama. The workflow can auto-resolve landmarks, geography, vegetation, and cultural micro-details, or accept direct overrides when the user wants exact control.
- Primary Action: install
- Primary Command: `bananahub add zkywalker/nanobanana-city-landmark-diorama`
- Install Command: `bananahub add zkywalker/nanobanana-city-landmark-diorama`
- Usage Stats: https://worker.bananahub.ai/api/usage-stats?repo=zkywalker%2Fnanobanana-city-landmark-diorama&template_id=city-landmark-diorama
- Template Source: https://github.com/zkywalker/nanobanana-city-landmark-diorama/tree/main
- Preview Image: https://raw.githubusercontent.com/zkywalker/nanobanana-city-landmark-diorama/main/samples/sample-3-pro-01.png

