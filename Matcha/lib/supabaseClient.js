import { createClient } from '@supabase/supabase-js'

/**
 * Vite only exposes vars prefixed with VITE_.
 * Supabase’s dashboard may give:
 *   - Legacy: Project URL + anon (JWT) key
 *   - New UI: VITE_PUBLIC_SUPABASE_URL + publishable key (sb_publishable_…)
 *
 * We accept several names so either style works.
 * Never use sb_secret_* (service/secret) in the browser — use the publishable/anon key only.
 */
function pickUrl() {
  const a = import.meta.env.VITE_SUPABASE_URL?.trim()
  const b = import.meta.env.VITE_PUBLIC_SUPABASE_URL?.trim()
  return a || b || ''
}

function pickAnonKey() {
  const publishable = import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()
  const legacy = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  const publicAnon = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (publishable) return publishable
  if (legacy && legacy.startsWith('sb_secret_')) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[matcha] VITE_SUPABASE_ANON_KEY is a secret key (sb_secret_). Do not use it in the app. Use the publishable key from Supabase → Settings → API (VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY).'
      )
    }
  } else if (legacy) {
    return legacy
  }
  if (publicAnon) return publicAnon
  return ''
}

const url = pickUrl()
const anonKey = pickAnonKey()

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured ? createClient(url, anonKey) : null
