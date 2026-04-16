import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split three.js into separate chunk
          if (id.includes('node_modules/three')) {
            return 'three'
          }
          
          // Split GLTF loader
          if (id.includes('GLTFLoader')) {
            return 'gltf-loader'
          }
          
          // Split react vendor
          if (id.includes('node_modules/react')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
