/**
 * Conversa com a API.
 *
 * A sessão vive num cookie httpOnly, então o token nunca passa pelo JavaScript
 * — é por isso que toda chamada leva `credentials: 'include'` e não existe
 * nenhum `localStorage.setItem('token', ...)` neste arquivo.
 */

import type { EstadoProgresso } from '@/progresso/store'

/** Vazio quando não há API configurada — aí o app roda 100% local. */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export const temApi = BASE !== ''

export type Usuario = {
  id: string
  nome_usuario: string
  email: string
  criado_em: string
}

/** Erro com mensagem já escrita para a pessoa ler. */
export class ErroDaApi extends Error {
  readonly campo: string | undefined
  readonly status: number

  constructor(mensagem: string, status: number, campo?: string) {
    super(mensagem)
    this.name = 'ErroDaApi'
    this.status = status
    this.campo = campo
  }
}

const SEM_REDE = 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.'

async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  if (!temApi) {
    throw new ErroDaApi('Este app está rodando sem servidor de contas.', 0)
  }

  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(opcoes.headers ?? {}),
      },
    })
  } catch {
    throw new ErroDaApi(SEM_REDE, 0)
  }

  const corpo = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const mensagem =
      (corpo && typeof corpo === 'object' && 'erro' in corpo && String(corpo.erro)) ||
      'Algo deu errado. Tente de novo.'
    const campo =
      corpo && typeof corpo === 'object' && 'campo' in corpo ? String(corpo.campo) : undefined
    throw new ErroDaApi(mensagem, resposta.status, campo)
  }

  return corpo as T
}

/* -------------------------------------------------------------------------- */

export function criarConta(dados: {
  nome_usuario: string
  email: string
  senha: string
}): Promise<{ usuario: Usuario }> {
  return chamar('/api/conta', { method: 'POST', body: JSON.stringify(dados) })
}

export function entrar(dados: {
  identificador: string
  senha: string
}): Promise<{ usuario: Usuario }> {
  return chamar('/api/sessao', { method: 'POST', body: JSON.stringify(dados) })
}

export function sair(): Promise<{ ok: boolean }> {
  return chamar('/api/sessao', { method: 'DELETE' })
}

export function quemSouEu(): Promise<{ usuario: Usuario | null }> {
  return chamar('/api/eu')
}

/** O que a API devolve de progresso — mesmo formato do store local, menos as reflexões. */
export type ProgressoRemoto = Pick<
  EstadoProgresso,
  'concluidas' | 'xpTotal' | 'ofensiva' | 'ultimoDia'
>

/**
 * Envia o progresso local e recebe de volta o resultado da mesclagem.
 *
 * As reflexões **não** vão junto: são texto livre sobre a vida da pessoa e
 * ficam só no aparelho dela. Ver api/modelos.py.
 */
export function sincronizarProgresso(
  concluidas: EstadoProgresso['concluidas'],
): Promise<ProgressoRemoto> {
  return chamar('/api/progresso', { method: 'PUT', body: JSON.stringify({ concluidas }) })
}
