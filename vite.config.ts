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
        rewrite: () => '/snowstorm/snomed-ct/browser/MAIN/descriptions',
      },
      // NCBO BioPortal — full RadLex ontology search (requires free API key in .env)
      '/api/bioportal': {
        target: 'https://data.bioontology.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/bioportal/, ''),
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
