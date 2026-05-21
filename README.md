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

### Donjon blog (curated from Ledger corporate blog)

Articles are fetched from the [Donjon category](https://www.ledger.com/blog/category/donjon) into `src/data/donjon-blog.json` (`npm run fetch:donjon-blog`, also runs before `npm run build`).

To **hide** a post from donjon.ledger.com without deleting it from the Ledger blog, add its URL to `src/data/donjon-blog-hidden.json` (optional `note` for maintainers). Hidden URLs are excluded on refresh and at build time. Do not remove entries from `donjon-blog.json` by hand—they will reappear on the next fetch unless they are listed as hidden.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` or `master` branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.

## License

MIT License - see [LICENSE.txt](LICENSE.txt)

## Links

- [Ledger Donjon GitHub](https://github.com/ledger-donjon)
- [Bug Bounty Program](https://donjon.ledger.com/bounty/)
- [X (Twitter)](https://x.com/donjonledger)
