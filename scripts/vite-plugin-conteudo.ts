/**
 * Plugin que transforma a pasta `conteudo/` num módulo importável.
 *
 * O app faz `import { trilhas } from 'virtual:conteudo'` e recebe a árvore já
 * validada. Em desenvolvimento, salvar qualquer YAML recarrega a lição na hora.
 *
 * Erro de conteúdo derruba o build — é o que impede uma lição quebrada de
 * chegar na frente da turma.
 */

import type { Plugin, ViteDevServer } from 'vite'
import { carregarConteudo } from '../conteudo/schema/carregar.ts'

const ID_VIRTUAL = 'virtual:conteudo'
const ID_RESOLVIDO = '\0' + ID_VIRTUAL

export function conteudoPlugin(raizProjeto: string): Plugin {
  let servidor: ViteDevServer | undefined

  return {
    name: '14bits:conteudo',

    configureServer(s) {
      servidor = s
      // O conteúdo vive fora de src/, então precisa ser observado explicitamente.
      s.watcher.add(`${raizProjeto}/conteudo`)
      s.watcher.on('all', (_evento, caminho) => {
        if (!caminho.endsWith('.yaml')) return
        const mod = s.moduleGraph.getModuleById(ID_RESOLVIDO)
        if (mod) {
          s.moduleGraph.invalidateModule(mod)
          s.ws.send({ type: 'full-reload' })
        }
      })
    },

    resolveId(id) {
      return id === ID_VIRTUAL ? ID_RESOLVIDO : null
    },

    load(id) {
      if (id !== ID_RESOLVIDO) return null

      const { conteudo, erros, avisos } = carregarConteudo(raizProjeto)

      for (const a of avisos) {
        this.warn(`[conteudo] ${a.arquivo}\n${a.mensagem}`)
      }

      if (erros.length > 0) {
        const resumo = erros.map((e) => `\n  ${e.arquivo}\n${e.mensagem}`).join('\n')
        const mensagem = `${erros.length} erro(s) de conteúdo:${resumo}`

        // Em dev, mostra o erro na tela sem matar o servidor.
        if (servidor) {
          this.error(mensagem)
        }
        throw new Error(mensagem)
      }

      return `export const trilhas = ${JSON.stringify(conteudo.trilhas)}\n`
    },
  }
}
