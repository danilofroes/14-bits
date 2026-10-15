/**
 * Sincronização automática em segundo plano.
 *
 * Fica aqui, e não dentro do store de progresso, para a dependência andar em
 * um sentido só: conta conhece progresso, progresso não conhece conta. Assim o
 * app continua funcionando inteiro com este arquivo removido.
 */

import { useProgresso } from '@/progresso/store'
import { useConta } from './store'

/** Espera a pessoa parar de avançar antes de subir — evita uma chamada por lição. */
const ESPERA = 2000

let agendado: ReturnType<typeof setTimeout> | undefined

export function ligarSincroniaAutomatica(): () => void {
  const cancelarInscricao = useProgresso.subscribe((estado, anterior) => {
    // Só interessa quando o conjunto de lições concluídas muda. Reflexão não
    // sobe, e XP é derivado disso no servidor.
    if (estado.concluidas === anterior.concluidas) return
    if (!useConta.getState().usuario) return

    clearTimeout(agendado)
    agendado = setTimeout(() => void useConta.getState().sincronizar(), ESPERA)
  })

  // Uma última tentativa ao fechar a aba, para não perder a lição recém-feita.
  const aoSair = () => {
    if (!useConta.getState().usuario) return
    clearTimeout(agendado)
    void useConta.getState().sincronizar()
  }
  window.addEventListener('pagehide', aoSair)

  return () => {
    cancelarInscricao()
    window.removeEventListener('pagehide', aoSair)
    clearTimeout(agendado)
  }
}
