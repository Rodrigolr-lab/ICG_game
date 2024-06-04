import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  assetsInclude: ['**/*.hdr'], // Add this line to include .hdr files as assets
  // base: '/ICG_game/', // Replace 'your-repo-name' with the name of your GitHub repository

})