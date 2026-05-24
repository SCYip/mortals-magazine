import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Truthy iff both env vars are present. The site falls back to the static
 * data bundled in src/data/articles.ts when Supabase isn't configured, so
 * developers can run `npm run dev` without ever touching Supabase.
 */
export const hasSupabase = Boolean(url && anonKey)

/**
 * Single shared client. Created lazily — when hasSupabase is false this is
 * null and every API call short-circuits to the static fallback.
 */
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false }, // public site: no auth state needed
    })
  : null
