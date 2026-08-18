/**
 * scripts/seed-supabase.ts
 *
 * One-shot seeder: takes the bundled static data (articles, columns,
 * volumes, hero slides, team, alumni) and upserts it into Supabase so
 * the editor panel and the live site share the same dataset.
 *
 * Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE=... npx tsx scripts/seed-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'
import { articles, columns, volumes } from '../src/data/articles'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------- Team (current editorial board) ----------
// Sourced from src/pages/AboutPage.tsx
const team = [
  { name: 'Albert Wang',      role: 'Editor-in-Chief', class_year: "'26", school: 'BIPH'  },
  { name: 'Timmy Zhang',      role: 'Co-Editor',       class_year: "'25", school: 'BIPH'  },
  { name: 'Jeff Li',          role: 'Senior Editor',   class_year: "'26", school: 'BIPH'  },
  { name: 'Jiayu Li',         role: 'Editor',          class_year: "'26", school: 'BIPH'  },
  { name: 'Serotonin',        role: 'Poetry Editor',   class_year: "'27", school: 'BIPH'  },
  { name: 'Peter Li',         role: 'Staff Writer',    class_year: "'25", school: 'BIPH'  },
  { name: 'David Cheng',      role: 'Staff Writer',    class_year: "'27", school: 'BIPH'  },
  { name: 'Tracy Shao Weiqi', role: 'Staff Writer',    class_year: "'25", school: 'BIBWH' },
]

// ---------- Alumni ----------
// Sourced from src/pages/AboutPage.tsx
const alumni = [
  {
    name: 'Timmy Zhang',
    role: 'Co-Editor in Chief, Vol. I',
    class_year: "'25",
    school: 'BIPH',
    portrait_url: '/images/alumni/timmy.jpeg',
    note: "Helped found The Mortals and edited the inaugural volume. Now studying abroad — but his fingerprints are on every page that came before.",
  },
  {
    name: 'Ares',
    role: 'Founding Contributor',
    class_year: "'25",
    school: 'BIPH',
    portrait_url: '/images/alumni/ares.jpeg',
    note: "Early staff writer who set the tone for the magazine's voice in fiction and poetry.",
  },
  {
    name: 'Thomas',
    role: 'Founding Contributor',
    class_year: "'25",
    school: 'BIPH',
    portrait_url: '/images/alumni/thomas.jpeg',
    note: "Editorial board alumnus whose work spans nonfiction essays and the magazine's earliest design decisions.",
  },
]

// ---------- Hero rotation slides ----------
// Mirrors STATIC_HERO_SLIDES in src/data/api.ts — the 5 photos scraped
// from the live mortalsmag.com slideshow.
const heroSlides = [1, 2, 3, 4, 5].map((n) => ({
  image_url: `/images/hero_slide_${n}.jpg`,
  alt_text: '',
  sort_order: n - 1,
  active: true,
}))

async function seed() {
  console.log(`\nSeeding ${SUPABASE_URL}\n`)

  // 1. COLUMNS (must come before articles — FK target)
  console.log('1/7  columns')
  {
    const rows = columns.map((c, i) => ({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      image_url: c.imageUrl ?? '',
      color: c.color,
      sort_order: i,
    }))
    const { error } = await supabase.from('columns').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
    console.log(`     ✓ ${rows.length} columns`)
  }

  // 2. ARTICLES
  console.log('2/7  articles')
  {
    // De-dupe on slug — articles.ts has a duplicate id "13" but unique slugs
    const seen = new Set<string>()
    const rows = articles
      .filter((a) => !seen.has(a.slug) && seen.add(a.slug))
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        author: a.author,
        author_affiliation: a.authorAffiliation ?? null,
        date_label: a.date,
        genre: a.genre,
        excerpt: a.excerpt,
        content: a.content,
        image_url: a.imageUrl ?? null,
        column_slug: a.columnSlug ?? null,
        tags: a.tags ?? [],
        published: true,
      }))
    const { error } = await supabase.from('articles').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
    console.log(`     ✓ ${rows.length} articles`)
  }

  // 3. VOLUMES
  console.log('3/7  volumes')
  {
    const rows = volumes.map((v, i) => ({
      slug: v.slug,
      title: v.title,
      season: v.season,
      year: v.year,
      theme: v.theme,
      image_url: v.imageUrl ?? '',
      sort_order: i,
    }))
    const { error } = await supabase.from('volumes').upsert(rows, { onConflict: 'slug' })
    if (error) throw error
    console.log(`     ✓ ${rows.length} volumes`)
  }

  // 4. ISSUES (children of volumes)
  console.log('4/7  issues')
  {
    const rows = volumes.flatMap((v) =>
      v.issues.map((iss, idx) => ({
        slug: iss.slug,
        volume_slug: v.slug,
        title: iss.title,
        season: iss.season,
        year: iss.year,
        quote: iss.quote,
        quote_author: iss.quoteAuthor,
        content: iss.content,
        // Without this a reseeded DB has no PDF links, so the issue page
        // silently degrades to the browser's print-to-PDF fallback.
        pdf_url: iss.pdfUrl ?? null,
        sort_order: idx,
      })),
    )
    if (rows.length > 0) {
      const { error } = await supabase.from('issues').upsert(rows, { onConflict: 'slug' })
      if (error) throw error
    }
    console.log(`     ✓ ${rows.length} issues`)
  }

  // 5. HERO SLIDES — wipe first since they use identity-PK
  console.log('5/7  hero_slides')
  {
    await supabase.from('hero_slides').delete().gte('id', 0)
    const { error } = await supabase.from('hero_slides').insert(heroSlides)
    if (error) throw error
    console.log(`     ✓ ${heroSlides.length} hero slides`)
  }

  // 6. TEAM MEMBERS — same pattern
  console.log('6/7  team_members')
  {
    await supabase.from('team_members').delete().gte('id', 0)
    const rows = team.map((t, i) => ({ ...t, sort_order: i, active: true }))
    const { error } = await supabase.from('team_members').insert(rows)
    if (error) throw error
    console.log(`     ✓ ${rows.length} team members`)
  }

  // 7. ALUMNI
  console.log('7/7  alumni')
  {
    await supabase.from('alumni').delete().gte('id', 0)
    const rows = alumni.map((a, i) => ({ ...a, sort_order: i }))
    const { error } = await supabase.from('alumni').insert(rows)
    if (error) throw error
    console.log(`     ✓ ${rows.length} alumni`)
  }

  console.log('\n✓ All seeded.\n')
}

seed().catch((err) => {
  console.error('\n✗ Seed failed:', err)
  process.exit(1)
})
