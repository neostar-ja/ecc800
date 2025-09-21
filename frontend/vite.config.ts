import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecc800/',
  server: {
    port: 5173,
    host: true
  },
  define: {
    'process.env.VITE_API_BASE': '"/ecc800/api"',
    'process.env.VITE_BASE': '"/ecc800/"'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts']
        }
      }
    }
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: []
    }
  }
})
