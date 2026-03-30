import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Non-empty string from env; `process.env` first so Vercel wins over a local .env with blank keys. */
function pickEnv(file, key) {
  const a = process.env[key]
  if (a != null && String(a).trim() !== '') return String(a).trim()
  const b = file[key]
  if (b != null && String(b).trim() !== '') return String(b).trim()
  return ''
}

function firstOf(file, keys) {
  for (const k of keys) {
    const v = pickEnv(file, k)
    if (v) return v
  }
  return ''
}

/**
 * Embed Supabase settings into the client bundle at build time.
 * Vercel / Supabase integration often sets SUPABASE_URL + SUPABASE_ANON_KEY (no VITE_ prefix).
 */
function resolveSupabaseEnv(mode) {
  const file = loadEnv(mode, process.cwd(), '')

  const url = firstOf(file, [
    'VITE_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_URL',
  ])

  const key = firstOf(file, [
    'VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'PUBLIC_SUPABASE_ANON_KEY',
  ])

  if (process.env.VERCEL && (!url || !key)) {
    const supaKeys = Object.keys(process.env).filter((k) => /supabase/i.test(k))
    console.warn(
      '[matcha] Vercel build: Supabase URL or key missing after resolve. ' +
        'Add SUPABASE_URL + SUPABASE_ANON_KEY (or publishable key) to Project → Environment Variables for Production, then redeploy. ' +
        `SUPABASE-related keys seen in this build: ${supaKeys.length ? supaKeys.sort().join(', ') : '(none)'}`
    )
  }

  const publishable = key.startsWith('sb_publishable_') ? key : ''
  const legacyAnon = publishable ? '' : key

  return { url, publishable, legacyAnon }
}

export default defineConfig(({ mode }) => {
  const { url, publishable, legacyAnon } = resolveSupabaseEnv(mode)

  return {
    plugins: [react()],
    base: process.env.VITE_BASE?.trim() || './',
    define: {
      'import.meta.env.VITE_PUBLIC_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
      'import.meta.env.VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY': JSON.stringify(publishable),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(legacyAnon),
    },
  }
})
