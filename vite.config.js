import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Brandy-s-Desired-Apartment/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    target: 'es2020'
  },
  
  server: {
    port: 3000,
    open: true
  },
  
  preview: {
    port: 8080
  }
});