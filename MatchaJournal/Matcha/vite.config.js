import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset URLs so the app works on GitHub Pages (/repo/), nested paths, and static hosts
// without 404 on /assets/*.js. Override with env if needed, e.g. VITE_BASE=/my-repo/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE?.trim() || './',
})
