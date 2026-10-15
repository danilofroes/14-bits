/**
 * Contraste dos tokens de cor, nos dois temas.
 *
 * Lê o CSS direto do disco em vez de repetir os valores aqui — se alguém
 * mudar uma cor e ela ficar ilegível, o teste quebra no commit e não numa
 * oficina com o projetor ligado. PLANEJAMENTO.md §6.2 exige AA (4,5:1).
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Caminho a partir da raiz do projeto: sob jsdom, `import.meta.url` é uma URL
// http e não serve para ler arquivo.
const css = readFileSync(join(process.cwd(), 'src/design/tokens.css'), 'utf8')

/** Extrai os tokens de um bloco delimitado pelo seletor informado. */
function tokensDoBloco(inicio: string): Record<string, string> {
  const posicao = css.indexOf(inicio)
  if (posicao === -1) throw new Error(`bloco não encontrado no tokens.css: ${inicio}`)

  const abertura = css.indexOf('{', posicao)
  let profundidade = 0
  let fim = abertura
  for (let i = abertura; i < css.length; i++) {
    if (css[i] === '{') profundidade++
    if (css[i] === '}') {
      profundidade--
      if (profundidade === 0) {
        fim = i
        break
      }
    }
  }

  const corpo = css.slice(abertura, fim)
  const tokens: Record<string, string> = {}
  for (const [, nome, valor] of corpo.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens[nome!] = valor!
  }
  return tokens
}

function luminancia(hex: string): number {
  const n = hex.replace('#', '')
  const canais = [0, 2, 4].map((i) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * canais[0]! + 0.7152 * canais[1]! + 0.0722 * canais[2]!
}

export function contraste(frente: string, fundo: string): number {
  const a = luminancia(frente)
  const b = luminancia(fundo)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const claro = tokensDoBloco('@theme')
const escuro = tokensDoBloco(":root[data-tema='escuro']")

/** Tokens usados como cor de texto sobre papel ou superfície. */
const TEXTO = ['tinta', 'tinta-suave', 'tinta-fraca', 'ceu', 'latao', 'mata', 'terra']
const FUNDOS = ['papel', 'superficie']

const AA = 4.5

describe.each([
  ['claro', claro],
  ['escuro', escuro],
])('tema %s', (_nome, tokens) => {
  it('define todos os tokens de texto e de fundo', () => {
    for (const t of [...TEXTO, ...FUNDOS]) {
      expect(tokens[t], `token --color-${t} ausente`).toBeDefined()
    }
  })

  it.each(TEXTO)('%s tem contraste AA sobre papel e superfície', (token) => {
    for (const fundo of FUNDOS) {
      const razao = contraste(tokens[token]!, tokens[fundo]!)
      expect(
        razao,
        `--color-${token} sobre --color-${fundo} = ${razao.toFixed(2)}:1 (mínimo ${AA}:1)`,
      ).toBeGreaterThanOrEqual(AA)
    }
  })
})

describe('estrutura do tokens.css', () => {
  it('mantém os dois temas escuros em sincronia', () => {
    // O bloco da media query e o do [data-tema] precisam ter os mesmos
    // valores, senão a escolha manual diverge do sistema.
    const porMediaQuery = tokensDoBloco(":root:not([data-tema='claro'])")
    expect(porMediaQuery).toEqual(escuro)
  })

  it('não deixa nenhum token de texto sem par no tema escuro', () => {
    expect(
      Object.keys(claro)
        .filter((k) => TEXTO.includes(k))
        .sort(),
    ).toEqual(
      Object.keys(escuro)
        .filter((k) => TEXTO.includes(k))
        .sort(),
    )
  })
})
