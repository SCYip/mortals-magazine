# The Mortals Magazine — Website Specification

## 1. Concept & Vision

A dark-navy literary magazine website for The Mortals, the first student-led magazine covering eleven BASIS China schools. The site embodies the gravitas of mortality and timeless literature — noble, contemplative, and authoritative. Every element should feel like opening a leather-bound anthology in a candlelit library: weighty, refined, and deeply intentional. The experience is immersive and editorial, never flashy.

---

## 2. Design Language

### Aesthetic Direction
**Dark Academia meets Digital Editorial** — Think *The Paris Review* on a midnight scroll. Rich dark navy backgrounds, warm gold accents, generous typography, and subtle starfield textures that reference the cosmos and the eternal nature of literature.

### Color Palette
| Role | Name | Hex |
|---|---|---|
| Background | Deep Space Navy | `#06091a` |
| Surface | Midnight Navy | `#0b1230` |
| Card Surface | Lifted Navy | `#111832` |
| Card Hover | Brightened Card | `#192048` |
| Primary Accent | Antique Gold | `#c9a84c` |
| Accent Hover | Bright Gold | `#e0c060` |
| Light Accent | Pale Gold | `#f0d890` |
| Text Primary | Warm Cream | `#f4f0e8` |
| Text Secondary | Muted Cream | `#b8b0a0` |
| Text Muted | Faded Muted | `#7a7488` |
| Border | Subtle Gold Line | `rgba(201,168,76,0.18)` |
| Divider | Warm Gray | `rgba(244,240,232,0.07)` |

### Typography
- **Display / Logo**: `Playfair Display` — serif, editorial, timeless. Weights: 400, 600, 700, 900.
- **Section Headings**: `Playfair Display` — bold, commanding.
- **Body Text**: `Crimson Pro` — elegant serif, highly readable for long-form content. Weights: 400, 500, 600.
- **Labels / UI / Tags**: `DM Mono` — grounded, precise. Creates contrast against serif. Weights: 400, 500.

### Spatial System
- Base unit: 8px
- Section vertical padding: 80px–120px
- Card padding: 24px–32px
- Max content width: 1200px (centered)
- Wide sections: 1400px

### Motion Philosophy
- **Entrance reveals**: fade + translate-Y(24px) → 0, 600ms ease-out, staggered 80ms
- **Scroll-driven reveals**: Intersection Observer triggers per section
- **Card hover**: translateY(-4px), border-color brightens, 200ms ease
- **Navigation transitions**: 300ms smooth color transitions
- **Star field**: CSS animated twinkling effect on hero background

### Visual Assets
- **Icons**: Lucide React (clean, minimal, consistent stroke)
- **Images**: All images sourced from the original Wix website assets (URLs to be preserved). Fallback: CSS gradient placeholders with gold shimmer.
- **Decorative Elements**: Gold gradient dividers, subtle star dots, thin gold rule separators

---

## 3. Layout & Structure

### Page Architecture
```
Navbar (sticky, blurs on scroll)
├── Logo + Nav Links
└── CTA Buttons (Submit, Join)

Home Page:
├── Hero (full-viewport, tagline + CTAs + animated background)
├── About Strip (brief intro + 3 stats)
├── Latest Volume Section
├── Activities Bar (3 CTAs)
├── Editor's Picks (horizontal scroll cards)
├── Writing Contests Feature (dark card with gold accent)
├── Writing Courses Feature
├── Writers' Workshops Feature
├── Columns Section (4 cards grid)
└── Editor's Note (full-width quote)

Events/Contests Page:
├── Page Hero
├── BIPH Writers' Workshop
├── Writing Courses/Apprenticeship
└── Annual Writing Contest

All Articles Page:
├── Filter Tabs (All / Nonfiction / Fiction Poetry / Fiction Prose / Reviews)
├── Article Grid
└── Pagination

Individual Article Page:
├── Article Header (title, author, date, genre)
├── Article Body
└── Related Articles

Genres Pages: (Nonfiction / Fiction Poetry / Fiction Prose / Reviews)
├── Page Header
└── Article Grid

Columns Pages:
├── Column Header (name, description, image)
└── Column Articles

About Page:
├── Mission Statement
├── Team
└── Acknowledgements

Volumes Pages:
├── Volume Hero
├── Issue Cards
└── Individual Issue Pages
```

### Responsive Strategy
- Desktop: 1200px+ (full layout)
- Tablet: 768px–1199px (2-column grids)
- Mobile: <768px (single column, hamburger menu)

---

## 4. Features & Interactions

### Navigation
- Sticky navbar that becomes more opaque on scroll (backdrop-filter blur)
- Mobile: hamburger menu with slide-in drawer
- Active page highlighting

### Hero Section
- Animated star-field background (CSS)
- Large editorial headline with fade-in
- Three CTAs: Activities, Submit, Join Us
- Scroll indicator (animated chevron)

### Activity Bar
- Three cards with icons: Activities, Submit Work, Join Team
- Hover: lift + gold border glow

### Editor's Picks
- Horizontal scrolling carousel of article cards
- Each card: title, author, excerpt, genre tag
- Click navigates to article page

### Article Cards
- Hover: lift + border glow
- Genre tag in DM Mono
- Author + date in muted text

### Columns Section
- 4-column grid (2x2 on tablet, 1-col on mobile)
- Each column card: name, tagline, image, description
- Hover: gold underline reveal

### Editor's Note
- Full-width editorial section
- Large italicized quote
- Authors' names
- Gold divider above and below

### Forms
- Submit button links to external Microsoft Forms
- Join button links to GitHub Pages departments site

### Pagination
- Prev / Next buttons
- Page numbers
- Disabled states

---

## 5. Component Inventory

### Navbar
- Logo (Playfair Display, gold)
- Links: Home, Events/Contests, Genres, Columns, Volumes, About
- Submit CTA (ghost gold button)
- Join CTA (solid gold button)
- Mobile: hamburger → slide-in drawer
- States: transparent (top), blurred dark (scrolled)

### ArticleCard
- Genre tag (DM Mono, gold)
- Title (Playfair Display)
- Author + Date (Crimson Pro, muted)
- Excerpt (Crimson Pro, 2-line clamp)
- Hover: lift + gold border

### ColumnCard
- Column name (Playfair Display)
- Tagline (Crimson Pro)
- Hover: gold underline slide-in

### HeroSection
- Full-viewport height
- Star-field animated background
- Large headline (Playfair Display, 900 weight)
- Subheadline (Crimson Pro)
- Three CTA buttons
- Scroll indicator

### SectionHeading
- Overline label (DM Mono, gold)
- Main heading (Playfair Display)
- Optional subheading (Crimson Pro)

### Footer
- Logo + tagline
- Navigation links
- Social/contact info
- Copyright
- Gold top border

---

## 6. Technical Approach

### Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Styling**: Pure CSS with CSS custom properties (no Tailwind)
- **Animation**: CSS transitions + Intersection Observer API

### Architecture
```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── AboutStrip.tsx
│   │   ├── VolumeSection.tsx
│   │   ├── ActivitiesBar.tsx
│   │   ├── EditorsPicks.tsx
│   │   ├── ContestsFeature.tsx
│   │   ├── CoursesFeature.tsx
│   │   ├── WorkshopsFeature.tsx
│   │   ├── ColumnsSection.tsx
│   │   └── EditorsNote.tsx
│   ├── articles/
│   │   └── ArticleCard.tsx
│   ├── sections/
│   │   └── SectionHeading.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Tag.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── EventsContestsPage.tsx
│   ├── AllArticlesPage.tsx
│   ├── ArticlePage.tsx
│   ├── GenrePage.tsx
│   ├── ColumnPage.tsx
│   ├── AboutPage.tsx
│   └── VolumesPage.tsx
├── data/
│   └── articles.ts
├── styles/
│   └── global.css
├── App.tsx
└── main.tsx
```

### Image Strategy
- Primary: Use images from the original website/Wix by referencing their CDN URLs
- Fallback: Elegant CSS gradient placeholders with `rgba(201,168,76,0.15)` base and gold shimmer animation
- Lazy loading via `loading="lazy"` attribute

### Routing
```
/                           → Home
/events-contests            → Events/Contests
/all-articles               → All Articles
/all-articles/:slug         → Article Detail
/all-articles/categories/nonfiction  → Nonfiction
/all-articles/categories/fiction-prose → Fiction Prose
/all-articles/categories/fiction-poetry → Fiction Poetry
/all-articles/categories/reviews → Reviews
/column/:slug               → Column Page (inkmagination, astronomical, whales, forteenlines)
/about                      → About
/volumes                    → Volumes
/volumes/:slug              → Volume Issue
```
