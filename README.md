# The Mortals — BASIS China Literary Magazine

A student-led literary magazine for the eleven BASIS China schools. Fiction,
essays, poetry, memoirs, reviews — and an editorial chrome that reads like a
magazine instead of a SaaS landing page.

Built with **Vite + React 18 + TypeScript** and a hand-rolled CSS design
system (no Tailwind, no UI kit).

## Local development

```bash
npm install
npm run dev      # → http://localhost:5173
```

## Production build

```bash
npm run build    # tsc + vite build → dist/
npm run preview  # serve dist/ locally
```

## Deploying to Netlify

The repo ships with `netlify.toml` and `public/_redirects` already configured
for SPA routing. Two ways to deploy:

### Option A — Connect the repo (recommended)

1. Push this repo to GitHub.
2. On Netlify: **Add new site → Import from Git → GitHub → pick this repo.**
3. Netlify auto-detects the config from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `20`
4. Click **Deploy site.** Subsequent pushes to `main` redeploy automatically.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify init           # links the repo to a new site
netlify deploy --prod  # build + deploy
```

## Project layout

```
src/
  components/
    home/        # HeroSection, AboutStrip, VolumeSection, EditorsPicks…
    articles/    # ArticleCard
    layout/      # Navbar, Footer
    ui/          # Reveal, ScrollToTop, SectionFolio
  pages/         # HomePage, AllArticlesPage, AboutPage, VolumesPage…
  data/          # articles.ts (content)
  styles/        # global.css (tokens + editorial primitives)
public/
  images/        # hero slides, team photos, volume cover, feature photos
  _redirects     # Netlify SPA fallback
```

## Design system

CSS custom properties drive the whole interface. The palette is
**blue + white** (royal-blue accents on white paper); typography is
Playfair Display + Crimson Pro + Inter.

Editorial primitives in `src/styles/global.css`: `.folio`, `.kicker`,
`.colophon`, `.fine-rule`, `.vertical-mark`, `.ed-link`, `.pullquote`.

## Image sourcing

Hero slides, team photos, feature imagery, and volume covers are sourced
from the original [mortalsmag.com](https://www.mortalsmag.com) Wix
deployment. The full archive (78 MB, 119 originals) lives outside the
repo (`scraped_images/` is gitignored); a curated set lives in
`public/images/` with semantic filenames.

## License

All editorial content and photography © The Mortals · BASIS China.
The site code is private to the project.
