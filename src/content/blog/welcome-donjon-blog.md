---
title: "Publishing on donjon.ledger.com"
date: 2026-05-20
excerpt: "A short pilot post showing how Donjon can publish research directly on this site."
draft: false
---

This is an **example post** for the Donjon website's on-site blog feature. It demonstrates how Markdown content is rendered and styled when hosted directly on this platform.

## Two ways we publish

The Donjon team publishes security research through two channels, both surfaced on the same blog index:

1. **On this site** — Markdown files under `src/content/blog/`, like this article. They appear on the [blog index](/blog/) and open directly on donjon.ledger.com.
2. **On the corporate blog** — Most Donjon articles remain on [ledger.com](https://www.ledger.com/blog/category/donjon); our site lists them and links out in a new tab.

Both types are merged chronologically. Local posts display a **Donjon** badge in the listing, while external posts show an external-link icon.

## For maintainers

To write a new on-site article, add a Markdown file under `src/content/blog/`. The filename becomes the URL slug — for example, `my-research.md` is served at `/blog/my-research/`.

Every post needs this frontmatter:

```yaml
title: "Your title"
date: 2026-05-20
excerpt: "One-line summary shown on the blog index."
draft: false
```

> Set `draft: true` to hide a post from production builds while you are still writing. Drafts are still visible during local development with `astro dev`.

## What about code?

Code blocks render with syntax highlighting out of the box. Here is a quick example:

```python
def greet(name: str) -> str:
    return f"Hello from the Donjon, {name}!"
```

Tables, blockquotes, images, and all standard Markdown features are supported.

---

*Pilot content — safe to remove or replace when the first real on-site article ships.*
