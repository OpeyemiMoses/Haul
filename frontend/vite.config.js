import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^react-aria\/(.*)$/,
        replacement: `${path.resolve(__dirname, 'node_modules/react-aria/dist/exports')}/$1.js`,
      },
    ],
  },
  build: {
    rollupOptions: {
      external: ['@stripe/stripe-js'],
    },
  },
})
