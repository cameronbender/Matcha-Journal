import { copyFileSync } from 'node:fs'

// GitHub Pages has no SPA fallback; serving index.html as 404.html fixes deep-link refreshes.
copyFileSync('dist/index.html', 'dist/404.html')
