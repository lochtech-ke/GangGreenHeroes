import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // Optimize bundle size and performance
    // Requirements: 6.5, 7.1, 7.4, 7.5
    
    // Enable minification for production
    minify: 'esbuild',
    
    // Optimize chunk splitting for better caching
    rollupOptions: {
      external: ['openai'],
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Keep splash screen in main bundle for fast initial load
        },
      },
    },
    
    // Set chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64
    
    // Enable source maps for debugging (can be disabled in production)
    sourcemap: false,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
    ],
    // Exclude large dependencies that should be loaded on demand
    exclude: [],
  },
  
  // Performance optimizations
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Enable tree shaking
    treeShaking: true,
  },
})
