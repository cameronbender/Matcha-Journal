import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Resolve Supabase env for the browser bundle. Vite only exposes import.meta.env.VITE_* unless
 * we inject them here — Vercel often provides SUPABASE_URL / SUPABASE_ANON_KEY (no VITE_ prefix).
 */
function resolveSupabaseEnv(mode) {
  const file = loadEnv(mode, process.cwd(), '')
  const pick = (k) => (file[k] ?? process.env[k] ?? '').toString().trim()

  const url =
    pick('VITE_PUBLIC_SUPABASE_URL') ||
    pick('VITE_SUPABASE_URL') ||
    pick('SUPABASE_URL') ||
    pick('NEXT_PUBLIC_SUPABASE_URL')

  const key =
    pick('VITE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') ||
    pick('VITE_SUPABASE_ANON_KEY') ||
    pick('VITE_PUBLIC_SUPABASE_ANON_KEY') ||
    pick('SUPABASE_ANON_KEY') ||
    pick('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const publishable = key.startsWith('sb_publishable_') ? key : ''
  const legacyAnon = publishable ? '' : key

  return { url, publishable, legacyAnon }
}

// Relative asset URLs for static hosts / subpaths. Override: VITE_BASE=/my-repo/
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
