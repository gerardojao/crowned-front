import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const mkcertFactory = typeof mkcert === 'function' ? mkcert : mkcert?.default;
  const plugins = [react(),
    VitePWA({
    manifest: {
      name: 'TallerCrowned',
      short_name: 'TallerCrowned',
      description: 'Gestion de taller, ordenes, presupuestos y facturas',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  })];

  if (command === 'serve' && typeof mkcertFactory === 'function') {
    plugins.push(mkcertFactory());
  }

  return {
    plugins,
  };
})

