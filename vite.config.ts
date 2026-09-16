import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id) || id.includes('commonjsHelpers')) return 'react'
          if (id.includes('/node_modules/three/')) return 'three'
          if (/node_modules\/(@react-three|three-stdlib)\//.test(id)) return 'react-three'
        },
      },
    },
  },
})
