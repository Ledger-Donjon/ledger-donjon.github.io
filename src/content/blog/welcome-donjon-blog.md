---
title: "Publishing on donjon.ledger.com"
date: 2026-05-20
excerpt: "A short pilot post showing how Donjon can publish research directly on this site."
draft: false
---

This is an **example post** for the Donjon website’s on-site blog feature.

## Two ways we publish

1. **On this site** — Markdown files under `src/content/blog/`, like this article. They appear on the [blog index](/blog/) and open here at `/blog/welcome-donjon-blog/`.
2. **On the corporate blog** — Most Donjon articles remain on [ledger.com](https://www.ledger.com/blog/category/donjon); our site lists them and links out in a new tab.

## For maintainers

Add a new file `your-slug.md` with frontmatter:

```yaml
title: "Your title"
date: 2026-05-20
excerpt: "One-line summary for the list view."
draft: false
```

Set `draft: true` to hide a post from production builds while you are still writing.

---

*Pilot content — safe to remove or replace when the first real on-site article ships.*
