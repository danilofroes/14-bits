// `vitest/config` em vez de `vite` porque a configuração de teste mora no
// mesmo arquivo — é o defineConfig que conhece a chave `test`.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { conteudoPlugin } from './scripts/vite-plugin-conteudo.ts'

const raiz = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss(), conteudoPlugin(raiz)],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@conteudo': fileURLToPath(new URL('./conteudo', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    // O orçamento de performance do PLANEJAMENTO.md §6.2 é 250 KB de JS inicial.
    // Este aviso dispara bem antes disso, para dar tempo de reagir.
    chunkSizeWarningLimit: 200,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/teste/setup.ts'],
    include: ['src/**/*.teste.{ts,tsx}'],
  },
})
