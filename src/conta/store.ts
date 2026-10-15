/**
 * Estado da conta.
 *
 * A conta é **opcional**. O app inteiro funciona sem ela — é assim que alguém
 * entra pelo QR code na Nave e começa a estudar em dez segundos, sem digitar
 * nada. Entrar na conta serve para levar o progresso de um aparelho para outro.
 *
 * Por isso nada aqui bloqueia o app: se a API estiver fora do ar, o aprendizado
 * continua, e a sincronização tenta de novo depois.
 */

import { create } from 'zustand'
import * as api from './api'
import type { Usuario } from './api'
import { aplicarProgressoRemoto, useProgresso } from '@/progresso/store'

export type EstadoConta = {
  usuario: Usuario | null
  /** Verdadeiro até o app descobrir se há sessão aberta. */
  carregando: boolean
  sincronizando: boolean
  /** Último erro de sincronização, para avisar sem atrapalhar. */
  avisoSincronizacao: string | null
}

type Acoes = {
  iniciar: () => Promise<void>
  criarConta: (dados: { nome_usuario: string; email: string; senha: string }) => Promise<void>
  entrar: (dados: { identificador: string; senha: string }) => Promise<void>
  sair: () => Promise<void>
  sincronizar: () => Promise<void>
}

export const useConta = create<EstadoConta & Acoes>((set, get) => ({
  usuario: null,
  carregando: api.temApi,
  sincronizando: false,
  avisoSincronizacao: null,

  async iniciar() {
    if (!api.temApi) {
      set({ carregando: false })
      return
    }
    try {
      const { usuario } = await api.quemSouEu()
      set({ usuario, carregando: false })
      if (usuario) await get().sincronizar()
    } catch {
      // Sem rede, o app segue local. Não é erro que mereça tela.
      set({ carregando: false })
    }
  },

  async criarConta(dados) {
    const { usuario } = await api.criarConta(dados)
    set({ usuario })
    await get().sincronizar()
  },

  async entrar(dados) {
    const { usuario } = await api.entrar(dados)
    set({ usuario })
    await get().sincronizar()
  },

  async sair() {
    try {
      await api.sair()
    } finally {
      // Mesmo que a chamada falhe, sai localmente: insistir prenderia a pessoa
      // numa conta que ela já pediu para deixar.
      set({ usuario: null, avisoSincronizacao: null })
    }
  },

  /**
   * Manda o progresso local e adota o resultado da mesclagem.
   *
   * Mesclagem, não substituição: quem estudou no celular e depois entrou no
   * computador da Nave não pode perder o que fez.
   */
  async sincronizar() {
    if (!api.temApi || !get().usuario) return

    set({ sincronizando: true, avisoSincronizacao: null })
    try {
      const local = useProgresso.getState().concluidas
      const remoto = await api.sincronizarProgresso(local)
      aplicarProgressoRemoto(remoto)
      set({ sincronizando: false })
    } catch {
      set({
        sincronizando: false,
        avisoSincronizacao: 'Seu progresso está salvo no aparelho, mas ainda não subiu.',
      })
    }
  },
}))
