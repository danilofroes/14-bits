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
 */

import type { Licao, Passo, PassoQuiz } from '@conteudo/schema/schema.ts'

export type Resposta = {
  /** Índices escolhidos nas alternativas do quiz. */
  escolhas: number[]
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

export function ehQuiz(passo: Passo): passo is PassoQuiz {
  return passo.tipo === 'quiz'
}

/** Índice do passo que está aguardando ação. */
export function indiceAtual(estado: EstadoLicao): number {
  return estado.revelados - 1
}

/**
 * Decide o que o botão principal faz agora.
 *
 * Quiz sem resposta enviada pede "verificar"; qualquer outro passo, ou quiz já
 * respondido, avança. No último passo, conclui.
 */
export function acaoDisponivel(
  licao: Licao,
  estado: EstadoLicao,
  selecao: number[],
): AcaoDisponivel {
  const i = indiceAtual(estado)
  const passo = licao.passos[i]
  const ultimoPasso = i === licao.passos.length - 1

  if (passo && ehQuiz(passo) && !estado.respostas[i]) {
    return { tipo: 'verificar', habilitada: selecao.length > 0 }
  }
  return ultimoPasso ? { tipo: 'concluir' } : { tipo: 'continuar' }
}

/** Um quiz é acerto quando a seleção bate exatamente com as corretas. */
export function corrigirQuiz(passo: PassoQuiz, escolhas: number[]): boolean {
  const corretas = passo.alternativas
    .map((alternativa, indice) => (alternativa.correta ? indice : -1))
    .filter((indice) => indice >= 0)

  if (escolhas.length !== corretas.length) return false
  const escolhidas = new Set(escolhas)
  return corretas.every((indice) => escolhidas.has(indice))
}

/**
 * Registra a resposta de um quiz.
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
): EstadoLicao {
  const passo = licao.passos[indice]
  if (!passo || !ehQuiz(passo)) return estado

  const anterior = estado.respostas[indice]
  const correta = corrigirQuiz(passo, escolhas)

  return {
    ...estado,
    respostas: {
      ...estado.respostas,
      [indice]: {
        escolhas,
        correta,
        tentativas: (anterior?.tentativas ?? 0) + 1,
      },
    },
  }
}

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
 * Acertar de primeira vale o XP cheio. Cada quiz que precisou de mais de uma
 * tentativa reduz um pouco, mas nunca abaixo de 40% — a pessoa que errou e
 * insistiu aprendeu, e o app não deve dizer o contrário.
 */
export function xpGanho(licao: Licao, estado: EstadoLicao): number {
  const quizzes = licao.passos.filter(ehQuiz).length
  if (quizzes === 0) return licao.xp

  const deprimeira = Object.values(estado.respostas).filter(
    (r) => r.correta && r.tentativas === 1,
  ).length

  const proporcao = deprimeira / quizzes
  return Math.round(licao.xp * (0.4 + 0.6 * proporcao))
}
