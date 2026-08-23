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
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 1. External Vendor Libraries (node_modules)
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('docx') || id.includes('jszip') || id.includes('html2canvas')) {
                return 'vendor-docs';
              }
              if (id.includes('@supabase') || id.includes('idb')) {
                return 'vendor-db';
              }
              return 'vendor';
            }

            // 2. Heavy Feature Modules & Views (Isolated Chunks)
            if (id.includes('src/components/views/HomeTabView') || id.includes('src/components/TrendingBriefings') || id.includes('src/components/SampleBriefings')) {
              return 'feature-home';
            }
            if (id.includes('src/components/views/MissionTabView') || id.includes('src/components/MissionCommandBar')) {
              return 'feature-mission';
            }
            if (id.includes('src/components/views/AssetsTabView') || id.includes('src/components/PodcastManager') || id.includes('src/components/RSSManager')) {
              return 'feature-assets';
            }
            if (id.includes('src/components/views/SettingsTabView') || id.includes('src/features/settings')) {
              return 'feature-settings';
            }
            if (id.includes('src/components/BuildHealthDashboard')) {
              return 'feature-build-health';
            }
            if (id.includes('src/components/TelemetryDashboard') || id.includes('src/components/AnalyticsView') || id.includes('src/features/statistics')) {
              return 'feature-analytics';
            }
            if (id.includes('src/components/ManualPcmPlayer') || id.includes('src/components/CommutePlaylistEngine') || id.includes('src/components/DrivingMode')) {
              return 'feature-audio-player';
            }

            // 3. Shared Cross-Cutting Utilities & Stores
            if (id.includes('src/utils/audioExport') || id.includes('audioExport.ts')) {
              return 'shared-audio-export';
            }
            if (id.includes('src/features/store') || id.includes('features/store.ts')) {
              return 'shared-store';
            }
            if (id.includes('src/services/rssService') || id.includes('services/rssService.ts')) {
              return 'shared-rss-service';
            }
          },
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