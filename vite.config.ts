import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 4000, // 4MB threshold (app size warrants this for Turkish league manager)
        rollupOptions: {
          output: {
            // Manual chunk splitting for large modules
            manualChunks: {
              // MatchEngine is huge - give it its own chunk
              'engine-core': ['services/MatchEngine.ts'],
              // Core dependencies
              'react-vendor': ['react', 'react-dom']
            }
          }
        }
      }
    };
});
