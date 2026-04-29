# AGENTS.md — The Mortals Magazine Website

## Project Overview

This is a React 18 + TypeScript + Vite website for **The Mortals**, the first student-led magazine covering eleven BASIS China schools.

- **Live site**: https://www.mortalsmag.com (Wix-hosted, source of truth for content)
- **New site**: `d:\MortalsWebsite` (React rewrite — this codebase)
- **Design**: Light editorial aesthetic — warm cream/white base with dark navy hero + editors-note sections

## Design Aesthetic

- Light editorial with dark hero — warm cream/white backgrounds, pure white cards, muted deep blue accents
- Hero + editors-note: deep navy (`#0e1120`)
- Rest of site: warm cream (`#f7f5f0`), white cards
- Fonts: Playfair Display (display), Crimson Pro (body), DM Mono (labels/UI)
- Animations: fade + translateY reveals, scroll-driven via Intersection Observer

## Color Palette

```css
/* Light theme (main body) */
--color-bg: #f7f5f0;     /* warm cream */
--color-card: #ffffff;     /* white */
--color-accent: #3a6e9c;  /* muted blue */
--color-text: #1a1a24;     /* near-black */

/* Dark theme (hero, editors-note, navbar at top) */
--color-dark-bg: #0e1120;  /* deep navy */
--color-dark-text: #e8e4dc;
```

**DO NOT use gold/antique gold colors. User explicitly rejected gold.**
**DO NOT make the entire site dark blue — dark is only for hero and editors-note.**

## Image Sources

All images come from `public/images/` — downloaded from mortalsmag.com's Wix CDN (`static.wixstatic.com`).
**DO NOT generate or create images online. Only use existing images in `public/images/`.**

The homepage hero has a **5-slide background slideshow** using these files:
1. `/images/hero_galaxy_orig.webp` (1600x761)
2. `/images/hero_slide1_orig.jpg` (846x1271)
3. `/images/hero_slide3_orig.png` (901x1276)
4. `/images/slide_extra1.jpg` (1702x1276)
5. `/images/slide_extra2.jpg` (2243x1630)

These were downloaded from mortalsmag.com's Wix CDN. The original site loads slideshow images dynamically via JavaScript.

## Project Structure

```
src/
  App.tsx                    # Routes: /, /events-contests, /all-articles, /all-articles/:slug, /all-articles/categories/:genre, /column/:slug, /about, /volumes
  components/
    layout/                  # Navbar, Footer
    home/                    # HeroSection, AboutStrip, VolumeSection, ActivitiesBar, EditorsPicks, FeatureSection, ColumnsSection, EditorsNote
    articles/                # ArticleCard
    ui/                     # Reveal, ScrollToTop
  pages/
    HomePage, EventsContestsPage, AllArticlesPage, ArticlePage, GenrePage, ColumnPage, AboutPage, VolumesPage
  data/articles.ts           # Articles, Columns, Volumes, EditorsNote
  styles/global.css          # CSS variables, resets, buttons, tags, cards
public/images/              # All images from mortalsmag.com (downloaded from Wix CDN)
```

## Key CSS Variables (in global.css)

- Use `--color-bg`, `--color-card`, `--color-text`, `--color-text-sec` for light sections
- Use `--color-dark-bg`, `--color-dark-text`, `--color-dark-text-sec` for dark sections (hero, editors-note)
- Navbar: transparent dark at top of page, light on scroll
- Cards: use `--color-border` (not `--color-divider`) for borders
- Hover shadows: use `rgba(0,0,0,0.10)` not dark blue

## How to Add Images from mortalsmag.com

1. Navigate to mortalsmag.com and inspect the page
2. Find Wix CDN URLs (look for `static.wixstatic.com/media/{file_id}~mv2.{ext}`)
3. Download the original: `https://static.wixstatic.com/media/{file_id}~mv2.{ext}`
4. Save to `public/images/` with a descriptive name
5. Reference in code as `/images/filename.ext`

## Common Commands

```bash
npm install      # Install dependencies
npm run dev     # Start dev server
npm run build   # Production build → dist/
```
