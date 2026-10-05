import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Tohum veri (çekim tabloları) bundle içinde; APK'da yerelden yüklenir. SQLite'a taşınınca (Aşama 3/6) düşecek.
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 800 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
