import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: "window",
  },
  server: {
    port: 5174, // This should match the port allowed in your backend CORS config
    host: true
  }
  
})

