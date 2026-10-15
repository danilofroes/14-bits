/**
 * Motor de lição.
 *
 * Modelo de apresentação: revelação progressiva. Os passos aparecem um a um e
 * ficam na tela, então a pessoa pode reler o texto que acabou de ver enquanto
 * responde ao exercício — diferente do Duolingo, onde cada exercício substitui
 * o anterior. Para conteúdo conceitual isso importa: a explicação e a pergunta
 * precisam conviver.
 *
 * O motor é lógica pura, sem React. Isso mantém as regras testáveis sem montar
 * componente e permite trocar a apresentação depois sem reescrever as regras.
 *
 * ---
 *
 * Como as respostas são representadas
 *
 * Toda resposta corrigida é um `number[]`, e o truque que mantém isso simples é
 * que **a ordem escrita no YAML é a ordem correta**. O embaralhamento existe só
 * na tela: o componente mostra na ordem que quiser, mas devolve sempre o índice
 * estável do conteúdo. Assim quatro dos cinco tipos corrigem com `escolhas[i] === i`:
 *
 *   lacuna      escolhas[n] = índice da palavra posta na lacuna n
 *   ordenar     escolhas[n] = índice do item colocado na posição n
 *   associar    escolhas[n] = índice da definição ligada ao termo n
 *   classificar escolhas[n] = índice da categoria escolhida para o item n
 *   quiz        conjunto de índices das alternativas marcadas
 *
 * O valor -1 significa "ainda não preenchido".
 */

import { respostasDaLacuna, TIPOS_CORRIGIDOS } from '@conteudo/schema/schema.ts'
import type { Licao, Passo } from '@conteudo/schema/schema.ts'

export const VAZIO = -1

export type Resposta = {
  /** Índices estáveis, conforme descrito acima. Vazio em passos de texto livre. */
  escolhas: number[]
  /** Só em `reflexao`: o que a pessoa escreveu. */
  texto?: string
  correta: boolean
  /** Quantas vezes a pessoa tentou até acertar. Alimenta a fila de revisão. */
  tentativas: number
}

export type EstadoLicao = {
  /** Quantos passos estão visíveis. Sempre >= 1. */
  revelados: number
  /** Chave: índice do passo. */
  respostas: Record<number, Resposta>
  concluida: boolean
}

export type AcaoDisponivel =
  { tipo: 'verificar'; habilitada: boolean } | { tipo: 'continuar' } | { tipo: 'concluir' }

export function estadoInicial(): EstadoLicao {
  return { revelados: 1, respostas: {}, concluida: false }
}

/** O passo é corrigido — tem resposta certa e errada. */
export function ehCorrigido(passo: Passo): boolean {
  return (TIPOS_CORRIGIDOS as readonly string[]).includes(passo.tipo)
}

/** O passo pede alguma ação antes de avançar. */
export function ehInterativo(passo: Passo): boolean {
  if (passo.opcional) return false
  return ehCorrigido(passo) || passo.tipo === 'reflexao'
}

/** Índice do passo que está aguardando ação. */
export function indiceAtual(estado: EstadoLicao): number {
  return estado.revelados - 1
}

/** Quantas respostas o passo espera. */
export function quantidadeEsperada(passo: Passo): number {
  switch (passo.tipo) {
    case 'lacuna':
      return respostasDaLacuna(passo.enunciado).length
    case 'ordenar':
      return passo.itens.length
    case 'associar':
      return passo.pares.length
    case 'classificar':
      return passo.itens.length
    default:
      return 0
  }
}

/**
 * Primeira posição ainda vazia, ou `null` se está tudo preenchido.
 *
 * Devolve `null` em vez de -1 de propósito: -1 é um índice que passa em
 * `!== null` e vaza como "posição ativa" inexistente na interface.
 */
export function proximaVaga(escolhas: number[]): number | null {
  const i = escolhas.findIndex((v) => v === VAZIO)
  return i < 0 ? null : i
}

/**
 * A seleção atual já pode ser verificada?
 *
 * Deixar o botão apagado até a resposta estar completa evita o "verifiquei sem
 * querer" e, principalmente, evita contar uma tentativa que a pessoa nem fez.
 */
export function selecaoCompleta(passo: Passo, escolhas: number[], texto: string): boolean {
  if (passo.tipo === 'quiz') return escolhas.length > 0
  if (passo.tipo === 'reflexao') return texto.trim().length > 0
  if (!ehCorrigido(passo)) return true

  const esperado = quantidadeEsperada(passo)
  return escolhas.length === esperado && escolhas.every((e) => e !== VAZIO)
}

/**
 * Decide o que o botão principal faz agora.
 *
 * Passo interativo ainda sem resposta pede "verificar"; qualquer outro avança.
 * No último passo, conclui.
 */
export function acaoDisponivel(
  licao: Licao,
  estado: EstadoLicao,
  escolhas: number[],
  texto = '',
): AcaoDisponivel {
  const i = indiceAtual(estado)
  const passo = licao.passos[i]
  const ultimoPasso = i === licao.passos.length - 1

  if (passo && ehInterativo(passo) && !estado.respostas[i]) {
    return { tipo: 'verificar', habilitada: selecaoCompleta(passo, escolhas, texto) }
  }
  return ultimoPasso ? { tipo: 'concluir' } : { tipo: 'continuar' }
}

/* -------------------------------------------------------------------------- */
/* Correção                                                                    */
/* -------------------------------------------------------------------------- */

/** Acertos item a item — é o que o componente usa para marcar cada linha. */
export function acertosPorPosicao(passo: Passo, escolhas: number[]): boolean[] {
  switch (passo.tipo) {
    case 'lacuna':
    case 'ordenar':
    case 'associar':
      // A ordem do conteúdo é a correta, então acertar é escolhas[i] === i.
      return Array.from({ length: quantidadeEsperada(passo) }, (_, i) => escolhas[i] === i)

    case 'classificar':
      return passo.itens.map((item, i) => passo.categorias[escolhas[i] ?? VAZIO] === item.categoria)

    default:
      return []
  }
}

/** Um quiz é acerto quando a seleção bate exatamente com as corretas. */
export function corrigirQuiz(alternativas: { correta: boolean }[], escolhas: number[]): boolean {
  const corretas = alternativas
    .map((alternativa, indice) => (alternativa.correta ? indice : -1))
    .filter((indice) => indice >= 0)

  if (escolhas.length !== corretas.length) return false
  const escolhidas = new Set(escolhas)
  return corretas.every((indice) => escolhidas.has(indice))
}

export function corrigir(passo: Passo, escolhas: number[]): boolean {
  if (passo.tipo === 'quiz') return corrigirQuiz(passo.alternativas, escolhas)
  if (!ehCorrigido(passo)) return true

  const acertos = acertosPorPosicao(passo, escolhas)
  return acertos.length > 0 && acertos.every(Boolean)
}

/**
 * Registra a resposta de um passo interativo.
 *
 * Errar não bloqueia nem tira nada: a resposta fica registrada com o número de
 * tentativas e a lição segue. Punir erro trava o aprendizado, e numa oficina
 * presencial gera aluno parado esperando — ver PLANEJAMENTO.md §6.1.
 */
export function responder(
  licao: Licao,
  estado: EstadoLicao,
  indice: number,
  escolhas: number[],
  texto?: string,
): EstadoLicao {
  const passo = licao.passos[indice]
  if (!passo || !ehInterativo(passo)) return estado

  const anterior = estado.respostas[indice]
  const resposta: Resposta = {
    escolhas,
    correta: corrigir(passo, escolhas),
    tentativas: (anterior?.tentativas ?? 0) + 1,
  }
  if (texto !== undefined) resposta.texto = texto

  return {
    ...estado,
    respostas: { ...estado.respostas, [indice]: resposta },
  }
}

/* -------------------------------------------------------------------------- */
/* Progresso                                                                   */
/* -------------------------------------------------------------------------- */

/** Revela o próximo passo, ou marca a lição como concluída no último. */
export function avancar(licao: Licao, estado: EstadoLicao): EstadoLicao {
  if (estado.revelados >= licao.passos.length) {
    return { ...estado, concluida: true }
  }
  return { ...estado, revelados: estado.revelados + 1 }
}

/** Fração de 0 a 1 para a barra de progresso da lição. */
export function progresso(licao: Licao, estado: EstadoLicao): number {
  if (licao.passos.length === 0) return 1
  if (estado.concluida) return 1
  return (estado.revelados - 1) / licao.passos.length
}

/**
 * XP efetivamente ganho.
 *
 * Acertar de primeira vale o XP cheio. Cada exercício que precisou de mais de
 * uma tentativa reduz um pouco, mas nunca abaixo de 40% — a pessoa que errou e
 * insistiu aprendeu, e o app não deve dizer o contrário.
 *
 * `reflexao` não entra na conta: não tem resposta certa.
 */
export function xpGanho(licao: Licao, estado: EstadoLicao): number {
  const indicesCorrigidos = licao.passos
    .map((p, i) => (ehCorrigido(p) ? i : -1))
    .filter((i) => i >= 0)

  if (indicesCorrigidos.length === 0) return licao.xp

  const deprimeira = indicesCorrigidos.filter((i) => {
    const r = estado.respostas[i]
    return r?.correta && r.tentativas === 1
  }).length

  const proporcao = deprimeira / indicesCorrigidos.length
  return Math.round(licao.xp * (0.4 + 0.6 * proporcao))
}

/* -------------------------------------------------------------------------- */
/* Apresentação                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Embaralhamento estável: a ordem muda entre passos, mas não a cada
 * renderização — caso contrário as opções dançariam sob o dedo da pessoa.
 *
 * Gerador linear congruente simples; não precisa ser criptográfico, só
 * precisa ser o mesmo em toda renderização do mesmo passo.
 */
export function embaralharEstavel(tamanho: number, semente: number): number[] {
  const indices = Array.from({ length: tamanho }, (_, i) => i)
  let estado = semente + 1
  for (let i = tamanho - 1; i > 0; i--) {
    estado = (estado * 1664525 + 1013904223) % 4294967296
    const j = estado % (i + 1)
    const a = indices[i]!
    const b = indices[j]!
    indices[i] = b
    indices[j] = a
  }
  return indices
}

/**
 * Como `embaralharEstavel`, mas garante que nada fique no lugar certo quando
 * há mais de um item. Num exercício de ordenar, abrir já com a resposta pronta
 * é um bug de experiência, não sorte.
 */
export function embaralharDeslocado(tamanho: number, semente: number): number[] {
  if (tamanho < 2) return Array.from({ length: tamanho }, (_, i) => i)

  for (let tentativa = 0; tentativa < 12; tentativa++) {
    const ordem = embaralharEstavel(tamanho, semente + tentativa * 97)
    if (ordem.every((valor, posicao) => valor !== posicao)) return ordem
  }

  // Última saída: rotaciona, que nunca deixa ninguém no lugar de origem.
  return Array.from({ length: tamanho }, (_, i) => (i + 1) % tamanho)
}
