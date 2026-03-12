import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only use SSL in local development
    process.env.NODE_ENV !== 'production' && basicSsl()
  ].filter(Boolean),
  server: {
    host: true,
    https: true, // Enforce HTTPS
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
})
