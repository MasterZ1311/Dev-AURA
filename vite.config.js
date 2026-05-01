import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — never changes, cache forever
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Firebase — large but stable
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Charts — only needed on the Reports page
          'vendor-charts': ['recharts'],
          // DnD — only needed on Workflow page
          'vendor-dnd': ['@hello-pangea/dnd'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
})
