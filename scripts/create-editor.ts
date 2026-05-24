/**
 * scripts/create-editor.ts
 *
 * Create a new editor user directly via Supabase's Admin API, bypassing
 * the magic-link / OTP flow. We took this path because Supabase's
 * default "send a sign-up magic link" requires the project's Site URL
 * and Redirect Allowlist to point at the deployed editor — otherwise
 * the click on the email link redirects to http://localhost:3000 and
 * dies. Direct user creation sidesteps the whole email round-trip:
 * we generate a strong random password, create the user with email
 * already confirmed, and the chief shares the credentials with the
 * new editor over a secure channel.
 *
 * The `handle_new_user` trigger (see supabase/roles.sql) fires on the
 * resulting auth.users insert and creates the matching public.profiles
 * row with role='editor'. Promote to chief from the Editors panel in
 * the app if needed.
 *
 * Run:
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE=sb_secret_... \
 *   npx tsx scripts/create-editor.ts new-editor@example.com
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? ''
const email = process.argv[2]?.trim().toLowerCase()

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env var.')
  process.exit(1)
}
if (!email || !/.+@.+\..+/.test(email)) {
  console.error('Usage: npx tsx scripts/create-editor.ts <email>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Generate a 16-byte (32-hex-char) random password. Long enough that
// the chief can copy-paste it without an attacker brute-forcing it,
// short enough to read aloud if necessary.
const password = randomBytes(16).toString('hex')

async function createOrUpdate() {
  // Try to create fresh first.
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (!created.error) return { user: created.data.user, mode: 'created' as const }
  // If the user already exists (e.g., from a previous magic-link invite
  // that never completed), reset the password and confirm the email
  // on the existing row instead.
  if (!created.error.message.toLowerCase().includes('already')) {
    throw created.error
  }
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listed.error) throw listed.error
  const existing = listed.data.users.find(u => u.email?.toLowerCase() === email)
  if (!existing) throw new Error('user already exists but not found in listUsers')
  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (updated.error) throw updated.error
  return { user: updated.data.user, mode: 'reset' as const }
}

let result
try { result = await createOrUpdate() }
catch (e: any) {
  console.error('failed:', e?.message ?? e)
  process.exit(1)
}

const { user, mode } = result

console.log('')
console.log(`  Editor ${mode === 'created' ? 'created' : 'updated (password reset)'}.`)
console.log('  email:    ', email)
console.log('  password: ', password)
console.log('  user_id:  ', user?.id)
console.log('')
console.log('  Share these credentials with the new editor over a secure channel.')
console.log('  They sign in at https://mortals-editor.netlify.app/login and may')
console.log('  change their password from their account settings afterwards.')
console.log('')
