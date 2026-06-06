import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [
    react(),
    process.env.NODE_ENV !== 'production' && basicSsl(),
    // Serve .wasm files with the correct MIME type so TF.js WASM backend works
    {
      name: 'wasm-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
          }
          next();
        });
      }
    }
  ].filter(Boolean),
  server: {
    host: true,
    https: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  },
  optimizeDeps: {
    exclude: ['@vladmandic/face-api']
  }
})
