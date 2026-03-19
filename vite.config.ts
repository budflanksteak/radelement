import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev proxies mirror the /api/* paths used in production (Vercel Edge Functions).
      // Same URL works in both environments — only the handler differs.

      '/api/radelement': {
        target: 'https://api3.rsna.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/radelement/, '/radelement'),
      },
      '/api/snomed/descriptions': {
        target: 'https://browser.ihtsdotools.org',
        changeOrigin: true,
        secure: true,
        // Must preserve query string — the fixed path replaces only the path segment
        rewrite: (path: string) => {
          const qIdx = path.indexOf('?');
          const qs = qIdx !== -1 ? path.slice(qIdx) : '';
          return '/snowstorm/snomed-ct/browser/MAIN/descriptions' + qs;
        },
      },
      // NCBO BioPortal — full RadLex ontology search (requires free API key in .env)
      '/api/bioportal': {
        target: 'https://data.bioontology.org',
        changeOrigin: true,
        secure: true,
        // In local dev the Vercel Edge Function doesn't run, so we inject the
        // API key here directly from VITE_BIOPORTAL_KEY in .env
        rewrite: (path: string) => {
          const base = path.replace(/^\/api\/bioportal/, '');
          const apiKey = process.env.VITE_BIOPORTAL_KEY;
          if (!apiKey) return base;
          const sep = base.includes('?') ? '&' : '?';
          return `${base}${sep}apikey=${apiKey}`;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // BioPortal rejects requests with a localhost Origin header
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    }
  }
})
