# BananaHub

Static site and machine-readable catalog for browsing installable Nano Banana prompt templates.

Live at: **https://nano-banana-hub.github.io**

## What gets generated

`node scripts/build-catalog.js` rebuilds these output files:

- `catalog.json` — structured template catalog used by the homepage and agents
- `llms.txt` — short agent-oriented overview with canonical entry points
- `agent-catalog.md` — markdown digest of the current catalog
- `robots.txt` — crawler policy with sitemap reference
- `sitemap.xml` — sitemap for the site and machine-readable files

## How it works

- `catalog-source.json` defines which repos to index
- `scripts/build-catalog.js` fetches template frontmatter from GitHub and builds all generated catalog assets
- A GitHub Action rebuilds the assets daily and whenever the source config or builder changes
- The site is pure HTML/CSS/JS with no build step — GitHub Pages serves it directly

## Adding templates

1. Create a template following the Nano Banana template format
2. Add your repo to `catalog-source.json`
3. Rebuild locally or let GitHub Actions refresh the generated files

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

- Prefer `catalog.json`, `llms.txt`, and `agent-catalog.md` for agent access instead of scraping the visual homepage
- Generated install commands are intended to stay truthful to the `bananahub` CLI behavior
