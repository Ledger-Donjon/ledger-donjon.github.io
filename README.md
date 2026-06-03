# Ledger Donjon Website

The official website for **Ledger Donjon**, the security research team at Ledger.

🌐 **Live Site**: [donjon.ledger.com](https://donjon.ledger.com)

## Tech Stack

- **Framework**: [Astro](https://astro.build/) v5
- **Styling**: SCSS with CSS Custom Properties
- **Hosting**: GitHub Pages
- **Deployment**: GitHub Actions

## Development

### Prerequisites

- Node.js 22+
- npm

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server runs at `http://localhost:4321`.

## Project Structure

```
├── public/              # Static assets (images, fonts, etc.)
├── src/
│   ├── components/      # Reusable Astro components
│   ├── content/         # Content collections (LSB, threat-model)
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   └── styles/          # Global styles
├── astro.config.mjs     # Astro configuration
└── package.json
```

## Content

### Security Bulletins (LSB)

Security bulletins are located in `src/content/lsb/`. Each bulletin is a Markdown file with frontmatter:

```yaml
---
title: Ledger Security Bulletin XXX
summary: Brief description of the issue
---
```

### Threat Model

Threat model documentation is in `src/content/threat-model/`.

### Donjon blog

The blog index merges two sources:

1. **Corporate blog (external)** — Fetched from the [Donjon category](https://www.ledger.com/blog/category/donjon) into `src/data/donjon-blog.json` (`npm run fetch:donjon-blog`, also runs before `npm run build`). List entries link to ledger.com in a new tab.

   To **hide** an external post, add its URL to `src/data/donjon-blog-hidden.json` (optional `note`). Do not remove entries from `donjon-blog.json` by hand—they reappear on the next fetch unless listed as hidden.

2. **On-site posts (local)** — Markdown in `src/content/blog/`. Each file is served at `/blog/{filename-without-md}/`. Required frontmatter:

   ```yaml
   title: "Article title"
   date: 2026-05-20
   excerpt: "Summary shown on the blog index"
   draft: false
   ```

   Set `draft: true` to exclude a post from production builds while editing (`astro dev` still shows drafts).

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` or `master` branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.

## License

MIT License - see [LICENSE.txt](LICENSE.txt)

## Links

- [Ledger Donjon GitHub](https://github.com/ledger-donjon)
- [Bug Bounty Program](https://donjon.ledger.com/bounty/)
- [X (Twitter)](https://x.com/donjonledger)
