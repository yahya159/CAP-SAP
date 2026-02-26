import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { mockODataPlugin } from './src/mocks/mockPlugin'

// Set VITE_USE_REAL_BACKEND=true to proxy to the real CAP backend on :4004
// Leave unset (default) to use the in-memory mock plugin.
const useRealBackend = process.env.VITE_USE_REAL_BACKEND === 'true'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Mock OData backend – only active when NOT using the real CAP backend
    ...(useRealBackend ? [] : [mockODataPlugin()]),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Proxy to real CAP backend when VITE_USE_REAL_BACKEND=true
  ...(useRealBackend
    ? {
        server: {
          proxy: {
            '/odata/v4': {
              target: 'http://localhost:4004',
              changeOrigin: true,
            },
          },
        },
      }
    : {}),

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

