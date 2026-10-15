/**
 * Progresso do aluno.
 *
 * Fica inteiro no aparelho (IndexedDB). Sem login, sem servidor, sem dado
 * pessoal — ver PLANEJAMENTO.md §3.2. A consequência prática é que trocar de
 * celular perde o progresso, e isso é aceitável para um curso de três aulas.
 */

import { create } from 'zustand'
import { get as lerIdb, set as gravarIdb } from 'idb-keyval'

const CHAVE = '14bits:progresso:v1'

export type LicaoConcluida = {
  xp: number
  /** ISO 8601, só a data (YYYY-MM-DD). */
  em: string
}

export type EstadoProgresso = {
  /** Chave: `${idTrilha}/${idLicao}` */
  concluidas: Record<string, LicaoConcluida>
  xpTotal: number
  ofensiva: number
  /** Último dia em que a pessoa concluiu alguma lição. */
  ultimoDia: string | null
}

type Acoes = {
  concluirLicao: (idTrilha: string, idLicao: string, xp: number) => void
  estaConcluida: (idTrilha: string, idLicao: string) => boolean
  xpDaTrilha: (idTrilha: string) => number
  zerar: () => void
}

const ESTADO_INICIAL: EstadoProgresso = {
  concluidas: {},
  xpTotal: 0,
  ofensiva: 0,
  ultimoDia: null,
}

export function chaveLicao(idTrilha: string, idLicao: string): string {
  return `${idTrilha}/${idLicao}`
}

/** Data local no formato YYYY-MM-DD. Usa horário local, não UTC: a ofensiva
 *  precisa virar à meia-noite de quem está usando, não em Greenwich. */
export function hoje(agora: Date = new Date()): string {
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Quantos dias inteiros separam duas datas YYYY-MM-DD. */
export function diasEntre(de: string, ate: string): number {
  const a = new Date(`${de}T00:00:00`)
  const b = new Date(`${ate}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Regra da ofensiva: mesmo dia não muda nada, dia seguinte soma, qualquer
 * intervalo maior recomeça em 1. Sem punição além de voltar a contar —
 * ver PLANEJAMENTO.md §6.1.
 */
export function proximaOfensiva(
  ofensivaAtual: number,
  ultimoDia: string | null,
  dia: string,
): number {
  if (ultimoDia === null) return 1
  const diferenca = diasEntre(ultimoDia, dia)
  if (diferenca === 0) return Math.max(ofensivaAtual, 1)
  if (diferenca === 1) return ofensivaAtual + 1
  return 1
}

export const useProgresso = create<EstadoProgresso & Acoes>((set, get) => ({
  ...ESTADO_INICIAL,

  concluirLicao(idTrilha, idLicao, xp) {
    const chave = chaveLicao(idTrilha, idLicao)
    const estado = get()

    // Refazer uma lição não dá XP de novo, mas também não tira nada.
    if (estado.concluidas[chave]) return

    const dia = hoje()
    const proximo: EstadoProgresso = {
      concluidas: { ...estado.concluidas, [chave]: { xp, em: dia } },
      xpTotal: estado.xpTotal + xp,
      ofensiva: proximaOfensiva(estado.ofensiva, estado.ultimoDia, dia),
      ultimoDia: dia,
    }

    set(proximo)
    void gravar(proximo)
  },

  estaConcluida(idTrilha, idLicao) {
    return Boolean(get().concluidas[chaveLicao(idTrilha, idLicao)])
  },

  xpDaTrilha(idTrilha) {
    const prefixo = `${idTrilha}/`
    return Object.entries(get().concluidas)
      .filter(([chave]) => chave.startsWith(prefixo))
      .reduce((soma, [, valor]) => soma + valor.xp, 0)
  },

  zerar() {
    set(ESTADO_INICIAL)
    void gravar(ESTADO_INICIAL)
  },
}))

async function gravar(estado: EstadoProgresso): Promise<void> {
  try {
    await gravarIdb(CHAVE, estado)
  } catch {
    // Navegação anônima ou armazenamento bloqueado: o app continua funcionando,
    // só não lembra do progresso entre sessões.
  }
}

/** Chamado uma vez no boot, antes da primeira pintura. */
export async function carregarProgresso(): Promise<void> {
  try {
    const salvo = await lerIdb<EstadoProgresso>(CHAVE)
    if (salvo) {
      useProgresso.setState({
        concluidas: salvo.concluidas ?? {},
        xpTotal: salvo.xpTotal ?? 0,
        ofensiva: salvo.ofensiva ?? 0,
        ultimoDia: salvo.ultimoDia ?? null,
      })
    }
  } catch {
    // Sem progresso salvo — começa do zero.
  }
}
