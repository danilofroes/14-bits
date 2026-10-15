/**
 * Carregador de conteúdo — lê os YAML do disco, valida e monta a árvore.
 *
 * Usado pelo plugin de build (scripts/vite-plugin-conteudo.ts) e pelo
 * `npm run validar`. É deliberadamente o único lugar que sabe onde os
 * arquivos ficam, para que mudar o layout de pastas não espalhe alterações.
 *
 * Roda em Node, nunca no navegador.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { licao, trilha, MAX_PASSOS_RECOMENDADO } from './schema.ts'
import type { Conteudo, Licao, TrilhaCompleta } from './schema.ts'

export type Problema = {
  arquivo: string
  mensagem: string
}

export type Resultado = {
  conteudo: Conteudo
  erros: Problema[]
  avisos: Problema[]
  /** Todos os arquivos lidos — o plugin usa para observar mudanças em dev. */
  arquivos: string[]
}

/** Percorre um diretório recursivamente procurando arquivos com um nome exato. */
function procurar(dir: string, nomeArquivo: string): string[] {
  const achados: string[] = []
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada)
    if (statSync(caminho).isDirectory()) {
      achados.push(...procurar(caminho, nomeArquivo))
    } else if (entrada === nomeArquivo) {
      achados.push(caminho)
    }
  }
  return achados
}

/** Formata um erro do Zod de um jeito que aponta para a linha certa do YAML. */
function descreverErroZod(erro: unknown): string {
  if (erro && typeof erro === 'object' && 'issues' in erro) {
    const issues = (erro as { issues: Array<{ path: (string | number)[]; message: string }> })
      .issues
    return issues
      .map((i) => {
        const caminho = i.path.length > 0 ? i.path.join('.') : '(raiz)'
        return `  ${caminho}: ${i.message}`
      })
      .join('\n')
  }
  return String(erro)
}

export function carregarConteudo(raizProjeto: string): Resultado {
  const raizTrilhas = join(raizProjeto, 'conteudo', 'trilhas')
  const erros: Problema[] = []
  const avisos: Problema[] = []
  const arquivos: string[] = []
  const trilhas: TrilhaCompleta[] = []

  let pastas: string[] = []
  try {
    pastas = readdirSync(raizTrilhas).filter((p) => statSync(join(raizTrilhas, p)).isDirectory())
  } catch {
    // Sem pasta de trilhas ainda — não é erro, o app mostra estado vazio.
    return { conteudo: { trilhas: [] }, erros, avisos, arquivos }
  }

  const idsDeTrilha = new Set<string>()

  for (const pasta of pastas) {
    const dirTrilha = join(raizTrilhas, pasta)
    const arquivoTrilha = join(dirTrilha, 'trilha.yaml')
    const rel = (p: string) => relative(raizProjeto, p).split(sep).join('/')

    let dadosTrilha: unknown
    try {
      dadosTrilha = parseYaml(readFileSync(arquivoTrilha, 'utf8'))
      arquivos.push(arquivoTrilha)
    } catch (e) {
      erros.push({
        arquivo: rel(arquivoTrilha),
        mensagem: `não foi possível ler trilha.yaml — ${(e as Error).message}`,
      })
      continue
    }

    const analiseTrilha = trilha.safeParse(dadosTrilha)
    if (!analiseTrilha.success) {
      erros.push({ arquivo: rel(arquivoTrilha), mensagem: descreverErroZod(analiseTrilha.error) })
      continue
    }
    const t = analiseTrilha.data

    if (idsDeTrilha.has(t.id)) {
      erros.push({ arquivo: rel(arquivoTrilha), mensagem: `id de trilha repetido: "${t.id}"` })
    }
    idsDeTrilha.add(t.id)

    // --- lições desta trilha ---
    const licoes: Record<string, Licao> = {}
    const arquivoPorId = new Map<string, string>()

    for (const arquivoLicao of procurar(dirTrilha, 'licao.yaml')) {
      arquivos.push(arquivoLicao)
      let dados: unknown
      try {
        dados = parseYaml(readFileSync(arquivoLicao, 'utf8'))
      } catch (e) {
        erros.push({
          arquivo: rel(arquivoLicao),
          mensagem: `YAML inválido — ${(e as Error).message}`,
        })
        continue
      }

      const analise = licao.safeParse(dados)
      if (!analise.success) {
        erros.push({ arquivo: rel(arquivoLicao), mensagem: descreverErroZod(analise.error) })
        continue
      }
      const l = analise.data

      if (licoes[l.id]) {
        erros.push({
          arquivo: rel(arquivoLicao),
          mensagem: `id de lição repetido na trilha "${t.id}": "${l.id}"`,
        })
        continue
      }

      if (l.passos.length > MAX_PASSOS_RECOMENDADO) {
        avisos.push({
          arquivo: rel(arquivoLicao),
          mensagem: `${l.passos.length} passos — acima dos ${MAX_PASSOS_RECOMENDADO} recomendados. Considere quebrar em duas lições.`,
        })
      }

      licoes[l.id] = l
      arquivoPorId.set(l.id, rel(arquivoLicao))
    }

    // --- integridade referencial ---
    const referenciadas = new Set<string>()
    for (const m of t.modulos) {
      for (const idLicao of m.licoes) {
        referenciadas.add(idLicao)
        if (!licoes[idLicao]) {
          erros.push({
            arquivo: rel(arquivoTrilha),
            mensagem: `módulo "${m.id}" aponta para a lição "${idLicao}", que não existe no disco`,
          })
        }
      }
    }
    for (const idLicao of Object.keys(licoes)) {
      if (!referenciadas.has(idLicao)) {
        avisos.push({
          arquivo: arquivoPorId.get(idLicao) ?? rel(arquivoTrilha),
          mensagem: `lição "${idLicao}" existe no disco mas nenhum módulo a referencia — ela está invisível no app`,
        })
      }
    }

    trilhas.push({ ...t, licoes })
  }

  // --- requisitos entre trilhas ---
  for (const t of trilhas) {
    for (const req of t.requisitos) {
      if (!idsDeTrilha.has(req)) {
        erros.push({
          arquivo: `conteudo/trilhas/*/trilha.yaml`,
          mensagem: `trilha "${t.id}" exige a trilha "${req}", que não existe`,
        })
      }
    }
  }

  trilhas.sort((a, b) => a.ordem - b.ordem)

  return { conteudo: { trilhas }, erros, avisos, arquivos }
}
