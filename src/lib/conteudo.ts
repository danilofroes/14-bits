/**
 * Acesso ao conteúdo já validado pelo build.
 *
 * Tudo que o app sabe sobre trilhas e lições passa por aqui, para que a forma
 * como o conteúdo é entregue (hoje um módulo virtual, amanhã talvez uma
 * requisição) fique isolada em um arquivo só.
 */

import { trilhas } from 'virtual:conteudo'
import type { Licao, TrilhaCompleta } from '@conteudo/schema/schema.ts'

export { trilhas }

export function acharTrilha(id: string | undefined): TrilhaCompleta | undefined {
  return id ? trilhas.find((t) => t.id === id) : undefined
}

export function acharLicao(
  trilha: TrilhaCompleta | undefined,
  id: string | undefined,
): Licao | undefined {
  return trilha && id ? trilha.licoes[id] : undefined
}

/** Lições da trilha na ordem em que os módulos as declaram. */
export function licoesEmOrdem(trilha: TrilhaCompleta): Licao[] {
  return trilha.modulos.flatMap((m) =>
    m.licoes.map((id) => trilha.licoes[id]).filter((l): l is Licao => Boolean(l)),
  )
}

/** A lição seguinte dentro da trilha, ou undefined se esta era a última. */
export function proximaLicao(trilha: TrilhaCompleta, idAtual: string): Licao | undefined {
  const ordem = licoesEmOrdem(trilha)
  const i = ordem.findIndex((l) => l.id === idAtual)
  return i >= 0 ? ordem[i + 1] : undefined
}

export function totalDeLicoes(trilha: TrilhaCompleta): number {
  return licoesEmOrdem(trilha).length
}

/** Uma trilha está liberada quando todos os requisitos foram concluídos. */
export function trilhaLiberada(
  trilha: TrilhaCompleta,
  concluidas: (idTrilha: string, idLicao: string) => boolean,
): boolean {
  return trilha.requisitos.every((idRequisito) => {
    const requisito = trilhas.find((t) => t.id === idRequisito)
    if (!requisito) return true
    return licoesEmOrdem(requisito).every((l) => concluidas(requisito.id, l.id))
  })
}
