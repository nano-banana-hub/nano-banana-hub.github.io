# BananaHub

Static site for browsing [Nanobanana](https://github.com/nano-banana-hub/nanobanana) prompt templates.

Live at: **https://nano-banana-hub.github.io**

## How it works

- `catalog-source.json` defines which repos to index
- `scripts/build-catalog.js` fetches template frontmatter from GitHub and builds `catalog.json`
- A GitHub Action rebuilds the catalog daily and on changes to `catalog-source.json`
- The site is pure HTML/CSS/JS with no build step — GitHub Pages serves it directly

## Adding templates

1. Create a template following the [BananaHub spec](https://github.com/nano-banana-hub/nanobanana/blob/main/docs/bananahub-spec.md)
2. Add your repo to `catalog-source.json`
3. The catalog will be rebuilt automatically

## Local development

Open `index.html` in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Rebuild catalog manually

```bash
GITHUB_TOKEN=ghp_xxx node scripts/build-catalog.js
```
