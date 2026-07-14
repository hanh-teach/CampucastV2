import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Force development environment when running tests in Vitest to ensure development builds of React (including React.act) are loaded.
if (process.env.VITEST) {
  process.env.NODE_ENV = 'development';
}

export default defineConfig(() => {
  // Tự động tắt HMR nếu là production hoặc có biến DISABLE_HMR=true
  const isProduction = process.env.NODE_ENV === 'production';
  const disableHmr = isProduction || process.env.DISABLE_HMR === 'true';

  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-dom/test-utils': path.resolve(__dirname, './tests/act-alias.ts'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      // Nếu disable HMR → false, ngược lại → chỉ tắt overlay nhưng vẫn bật HMR
      hmr: disableHmr ? false : { overlay: false },
      watch: disableHmr ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // Allow Vite to handle chunking automatically
        },
      },
    },
    test: {
      define: {
        'process.env.NODE_ENV': '"development"',
      },
      exclude: ['node_modules', 'dist', '_archive_unused_architecture/**'],
      setupFiles: ['./tests/setup.ts'],
      globals: true,
      environment: 'jsdom',
    }
  };
});