import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const mkcertFactory = typeof mkcert === 'function' ? mkcert : mkcert?.default;
  const plugins = [react(),
    VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      cleanupOutdatedCaches: true,
    },
    manifest: {
      name: 'ZagaPro',
      short_name: 'ZagaPro',
      description: 'Sistema de gestion y control integral para negocios de servicios',
      lang: 'es',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'logozagapro.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'logozagapro.png',
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

