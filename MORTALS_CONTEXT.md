# MORTALS_CONTEXT.md — Complete Project Memory

> This file is the master memory for The Mortals Magazine website project.
> It captures the entire state of the project so any AI can take over without losing context.
> Update this file whenever significant decisions are made.

---

## What Is This Project

**The Mortals** is a React 18 + TypeScript + Vite website (the React rewrite) for a student-led literary magazine covering eleven BASIS China schools.

- **Live/Source of Truth**: https://www.mortalsmag.com (Wix-hosted)
- **React Rewrite**: `d:\MortalsWebsite` (this codebase)
- **Live deployment**: Built to `dist/` folder, deployable to GitHub Pages or any static host

---

## Color Scheme (Updated April 2026)

The website uses a **light editorial aesthetic** — warm cream/white base with a dark navy hero section, NOT the old dark blue-everything look.

### CSS Variables in `src/styles/global.css`

```css
/* LIGHT THEME (most of the page) */
--color-bg:          #f7f5f0;   /* warm cream white */
--color-surface:     #eeece8;   /* warm light gray surface */
--color-card:        #ffffff;   /* pure white cards */
--color-card-hover:  #f0ede6;  /* warm off-white hover */
--color-accent:      #3a6e9c;  /* muted deep blue accent */
--color-accent-h:    #5b9bd5;  /* lighter blue on hover */
--color-accent-pale: #2a5a82;  /* deep blue for text accents */
--color-text:        #1a1a24;  /* near-black */
--color-text-sec:    #4a4a5a;  /* medium gray text */
--color-text-muted:  #888896;  /* muted gray */
--color-border:      rgba(26, 26, 36, 0.10);
--color-border-h:    rgba(26, 26, 36, 0.25);
--color-divider:     rgba(26, 26, 36, 0.08);

/* DARK VARIANTS (hero, navbar on scroll start, editors note) */
--color-dark-bg:     #0e1120;  /* deep navy */
--color-dark-surface:#141728;  /* slightly lighter navy */
--color-dark-card:   #1c2038;
--color-dark-text:   #e8e4dc;  /* warm off-white */
--color-dark-text-sec:#a0a0b0;
--color-dark-divider: rgba(255,255,255,0.07);
```

### Color Scheme Rules
- **DO NOT** use gold/antique gold colors. User explicitly rejected gold.
- **DO NOT** make the entire site dark blue. The dark navy is ONLY for the hero and editors-note sections.
- The main body of the site is light cream/white.
- Accent color is muted blue (`#3a6e9c`), NOT bright blue or gold.

---

## Hero Section Slideshow

The homepage hero has a **5-slide background slideshow** with images from mortalsmag.com.

### Images Used
The images are in `public/images/` and come from the original mortalsmag.com Wix CDN.
The slideshow uses these files:
1. `/images/hero_galaxy_orig.webp` — Wide panoramic (1600x761) from mortalsmag.com
2. `/images/hero_slide1_orig.jpg` — Portrait/editorial photo (846x1271) from mortalsmag.com
3. `/images/hero_slide3_orig.png` — Large editorial image (901x1276, transparent) from mortalsmag.com
4. `/images/slide_extra1.jpg` — Extra large photo (1702x1276) from mortalsmag.com
5. `/images/slide_extra2.jpg` — Extra large photo (2243x1630) from mortalsmag.com

**Note**: The original mortalsmag.com loads its slideshow images dynamically via Wix's JavaScript — they are NOT in the static HTML. These images were found by analyzing the Wix page data and downloading the ~mv2 (original, no transforms) versions of images referenced on the site.

The overlay is light (`rgba(10, 14, 30, 0.15)` to `rgba(10, 14, 30, 0.80)`) so the images show through.

---

## Project Structure

```
d:\MortalsWebsite\
├── src/
│   ├── App.tsx                     # Routes: /, /events-contests, /all-articles, /all-articles/:slug, /all-articles/categories/:genre, /column/:slug, /about, /volumes
│   ├── main.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx + Navbar.css   # Transparent over hero, light on scroll
│   │   │   └── Footer.tsx + Footer.css
│   │   ├── home/
│   │   │   ├── HeroSection.tsx + .css    # Dark navy bg, 5-slide slideshow
│   │   │   ├── AboutStrip.tsx + .css     # Light cream background
│   │   │   ├── VolumeSection.tsx + .css   # White card with volume cover
│   │   │   ├── ActivitiesBar.tsx + .css   # Light background, 3 activity cards
│   │   │   ├── EditorsPicks.tsx           # Featured articles
│   │   │   ├── FeatureSection.tsx + .css  # Contests / Courses / Workshops
│   │   │   ├── ColumnsSection.tsx + .css  # 4 standing columns grid
│   │   │   └── EditorsNote.tsx + .css     # Dark navy footer section
│   │   ├── articles/
│   │   │   └── ArticleCard.tsx + .css
│   │   └── ui/
│   │       ├── Reveal.tsx          # Intersection Observer fade-in
│   │       └── ScrollToTop.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── EventsContestsPage.tsx + .css
│   │   ├── AllArticlesPage.tsx + .css
│   │   ├── ArticlePage.tsx + .css
│   │   ├── GenrePage.tsx + .css
│   │   ├── ColumnPage.tsx + .css
│   │   ├── AboutPage.tsx + .css
│   │   └── VolumesPage.tsx + .css
│   ├── data/
│   │   └── articles.ts             # Articles, Columns, Volumes, EditorsNote data
│   └── styles/
│       └── global.css              # CSS variables, resets, buttons, tags, cards, animations
├── public/images/                  # All images from mortalsmag.com (downloaded from Wix CDN)
│   ├── logo.png                   # Site logo (1494x1117)
│   ├── hero_galaxy_orig.webp      # Hero slideshow slide 1 (1600x761)
│   ├── hero_slide1_orig.jpg        # Hero slideshow slide 2 (846x1271)
│   ├── hero_slide3_orig.png        # Hero slideshow slide 3 (901x1276)
│   ├── slide_extra1.jpg            # Hero slideshow slide 4 (1702x1276)
│   ├── slide_extra2.jpg            # Hero slideshow slide 5 (2243x1630)
│   ├── col_ink.png                # Inkmagination column (640x640)
│   ├── col_astro.png              # Astronomical column (300x178)
│   ├── col_whale.png              # Whale Done column (1024x683)
│   ├── col_nature.png             # Forteenlines column (221x166)
│   ├── col_extra.png             # Extra large column image (1792x1024)
│   ├── volume_summer_fall.png     # Volume cover (846x1271)
│   ├── volume_winter.png          # Winter volume cover (901x1276)
│   ├── volume_thumb.png           # Volume thumbnail (2000x1125)
│   ├── article_large1.jpeg        # Article photo (1706x1279)
│   ├── article_large2.jpeg        # Article photo (1280x1707)
│   ├── article_large3.png        # Article image with transparency
│   ├── feat_contest.png           # Feature image (300x178)
│   ├── feat_courses.png          # Courses feature (1500x1125)
│   ├── feat_workshop.png         # Workshop feature (640x640)
│   ├── site_img_1.jpg, site_img_2.jpeg  # Generic site images
│   └── [various numbered Wix images]
├── dist/                           # Production build output
├── scripts/
│   ├── _scrape_mortals_live.py   # Scrapes mortalsmag.com and downloads all Wix CDN images
│   ├── _find_slides.py           # Debug script to find slideshow images in HTML
│   ├── _download_highres.py      # Downloads high-res ~mv2 versions of known images
│   └── _check_images.py          # Checks image dimensions
├── AGENTS.md                       # Short-term project memory
└── MORTALS_CONTEXT.md             # This file — full project memory
```

---

## Homepage Structure (matching mortalsmag.com)

1. **HeroSection** — Dark navy, 5-slide slideshow with images from mortalsmag.com
2. **AboutStrip** — Light cream bg (`--color-bg`), "About The Mortals" text + 3 pillars
3. **VolumeSection** — White card, shows current volume cover + description
4. **ActivitiesBar** — Light bg, "Three Ways to Engage" — Events, Submit, Join
5. **EditorsPicks** — Featured article cards
6. **FeatureSection** — Cream bg, Writing Contests / Writing Courses / Workshops
7. **ColumnsSection** — White bg, 4-column grid: Inkmagination, Astronomical, Whale Done, Forteenlines
8. **EditorsNote** — Dark navy, editor's note with quotes

---

## How to Get Images from mortalsmag.com

The original website loads its slideshow images dynamically via Wix's JavaScript — they're NOT in the static HTML. To find them:

1. Navigate to `https://www.mortalsmag.com` in a browser
2. The page uses Wix's SlideShowContainer component with images loaded from `static.wixstatic.com`
3. Look for `~mv2` file IDs in the HTML (these are the original files without transformation params)
4. Download the `~mv2` URL directly: `https://static.wixstatic.com/media/{file_id}~mv2.{ext}`
5. Alternative: Analyze network requests when the page loads to find the high-res versions

Run `_scrape_mortals_live.py` to download all images from the site, or use `_download_highres.py` with known image IDs.

---

## Key Routes

| Route | Component | Description |
|---|---|---|
| `/` | HomePage | Homepage with hero, sections |
| `/events-contests` | EventsContestsPage | Contests, courses, workshops |
| `/all-articles` | AllArticlesPage | All articles with genre filters |
| `/all-articles/:slug` | ArticlePage | Individual article |
| `/all-articles/categories/:genre` | GenrePage | Genre-filtered articles |
| `/column/:slug` | ColumnPage | Individual column |
| `/about` | AboutPage | About page with team |
| `/volumes` | VolumesPage | Magazine volumes and issues |

---

## Fonts

- **Display/Headings**: Playfair Display (Google Fonts)
- **Body**: Crimson Pro (Google Fonts)
- **Mono/Labels**: DM Mono (Google Fonts)

---

## Design Aesthetic

**Light editorial with dark hero** — Warm cream/white backgrounds for most sections, pure white cards, muted deep blue accents. The hero and editor's note sections use deep navy for contrast. NOT "all dark blue." NOT gold/accent colors.

---

## Common Tasks

### Adding an image from mortalsmag.com
1. Find the Wix CDN URL (look for `static.wixstatic.com/media/{id}~mv2.{ext}`)
2. Download to `public/images/` with a descriptive name
3. Reference in code as `/images/filename.ext`

### Changing colors
1. Update CSS variables in `src/styles/global.css`
2. For dark sections (hero, editors-note), use `--color-dark-*` variables
3. For light sections, use the light `--color-*` variables
4. Build: `npm run build`

### Running locally
```bash
npm install
npm run dev
```

### Building for production
```bash
npm run build
# Output in dist/
```
