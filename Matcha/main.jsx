import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './matcha-journal.jsx'

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(key)
      return v != null ? { value: v } : null
    },
    async set(key, value) {
      localStorage.setItem(key, value)
    },
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
