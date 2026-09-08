import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `--mode single` emite un único index.html con todo embebido (para previsualizar
// la portada sin servidor). El build normal es el habitual de Vite.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    target: 'es2020',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
}))
