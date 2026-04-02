# BananaHub

Public gallery and machine-readable catalog for installable BananaHub templates.

Live at: **https://bananahub-ai.github.io**

## Positioning

BananaHub is the installable template network for BananaHub Skill:

- BananaHub Skill handles constraint extraction, progressive guidance, and image generation inside the chat workflow
- BananaHub handles discovery, preview, installation, and machine-readable access for reusable templates

The goal is not to create one giant prompt dump. The goal is to keep the base workflow lean and let validated prompt and workflow structures remain searchable and installable.

## What gets generated

`node scripts/build-catalog.js` rebuilds these output files:

- `catalog.json` — merged structured catalog used by the homepage and agents
- `catalog-curated.json` — curated-only catalog
- `catalog-discovered.json` — discovered-only catalog
- `llms.txt` — short agent-oriented overview with canonical entry points
- `agent-catalog.md` — markdown digest of the current catalog
- `robots.txt` — crawler policy with sitemap reference
- `sitemap.xml` — sitemap for the site and machine-readable files

## How it works

- `catalog-source.json` defines the curated repos to index
- `moderation.json` applies manual controls such as pinning, featuring, and banning
- the Hub API provides discovered install candidates inferred from real template installs
- `scripts/build-catalog.js` merges curated + discovered templates, applies moderation, and builds all generated catalog assets
- A GitHub Action rebuilds the assets daily and whenever the source config or builder changes
- The site is pure HTML/CSS/JS with no build step — GitHub Pages serves it directly

## Adding templates

There are two ways for a template to appear:

1. **Curated**: create a template, add the repo to `catalog-source.json`, then rebuild
2. **Discovered**: publish the template repo and let real installs report it through the Hub API

`catalog-source.json` is the recommendation layer. Discovered templates are the open discovery layer.

## Local development

Serve the site with any static file server:

```bash
python3 -m http.server 8000
```

## Rebuild catalog manually

```bash
GITHUB_TOKEN=ghp_xxx node scripts/build-catalog.js
```

## Notes

- Prefer `catalog.json`, `catalog-curated.json`, `catalog-discovered.json`, `llms.txt`, and `agent-catalog.md` for agent access instead of scraping the visual homepage
- Generated install commands are intended to stay truthful to the `bananahub` CLI behavior
- Curated templates win over discovered duplicates in the merged catalog
