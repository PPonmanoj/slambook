import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    assetsInlineLimit: 0, // Don't inline large assets
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three'
          }
          if (id.includes('GLTFLoader')) {
            return 'gltf-loader'
          }
          if (id.includes('node_modules/react')) {
            return 'vendor'
          }
        },
      },
    },
  },
  publicDir: 'public',
})
