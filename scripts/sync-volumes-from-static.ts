/**
 * scripts/sync-volumes-from-static.ts
 *
 * Targeted re-sync: pushes the `volumes` constant from src/data/articles.ts
 * (which now mirrors the verbatim text on mortalsmag.com) into Supabase,
 * but ONLY touches the `volumes` and `issues` tables — leaves articles,
 * columns, hero_slides, team_members, alumni untouched. Safer than
 * re-running the full seeder when only the volume copy changed.
 *
 * Run:
 *   SUPABASE_URL=https://datercxlvabgiieqqucr.supabase.co \
 *   SUPABASE_SERVICE_ROLE=sb_secret_xxx \
 *   npx tsx scripts/sync-volumes-from-static.ts
 */

import { createClient } from '@supabase/supabase-js'
import { volumes } from '../src/data/articles'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function run() {
  console.log(`\nSyncing volumes + issues → ${SUPABASE_URL}\n`)

  // 1. VOLUMES — upsert by slug
  const volumeRows = volumes.map((v, i) => ({
    slug: v.slug,
    title: v.title,
    season: v.season,
    year: v.year,
    theme: v.theme,
    image_url: v.imageUrl ?? '',
    sort_order: i,
  }))
  {
    const { error } = await supabase
      .from('volumes')
      .upsert(volumeRows, { onConflict: 'slug' })
    if (error) throw error
    console.log(`✓ ${volumeRows.length} volumes upserted`)
  }

  // 2. ISSUES — upsert by slug. Existing rows with the same slug
  // will be migrated to the correct volume_slug if they moved.
  const issueRows = volumes.flatMap((v) =>
    v.issues.map((iss, idx) => ({
      slug: iss.slug,
      volume_slug: v.slug,
      title: iss.title,
      season: iss.season,
      year: iss.year,
      quote: iss.quote,
      quote_author: iss.quoteAuthor,
      content: iss.content,
      // Without this a resynced DB has no PDF links, so the issue page
      // silently degrades to the browser's print-to-PDF fallback.
      pdf_url: iss.pdfUrl ?? null,
      sort_order: idx,
    })),
  )
  if (issueRows.length > 0) {
    const { error } = await supabase
      .from('issues')
      .upsert(issueRows, { onConflict: 'slug' })
    if (error) throw error
    console.log(`✓ ${issueRows.length} issues upserted`)
  } else {
    console.log('  (no issues in static data — skipping issues table)')
  }

  // 3. Verification read-back
  const [{ data: vData }, { data: iData }] = await Promise.all([
    supabase.from('volumes').select('slug,title,theme').order('sort_order'),
    supabase.from('issues').select('slug,volume_slug,title,quote_author'),
  ])
  console.log('\nVolumes now in DB:')
  for (const v of vData ?? []) console.log(`  - ${v.slug}  [${v.theme}]  ${v.title}`)
  console.log('\nIssues now in DB:')
  for (const i of iData ?? []) console.log(`  - ${i.slug}  → volume=${i.volume_slug}  ${i.title}`)
  console.log('\n✓ Sync complete.\n')
}

run().catch((err) => {
  console.error('\n✗ Sync failed:', err)
  process.exit(1)
})
