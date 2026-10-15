import type { Passo } from '@conteudo/schema/schema.ts'
import type { Resposta } from '@/engine/motor'

/**
 * Contrato de todo bloco.
 *
 * Um bloco recebe o passo, o que já foi respondido e a seleção em andamento —
 * e nunca fala com o store de progresso nem com o roteador. Isso é o que
 * permite testar cada tipo de exercício isoladamente e o que impede que um
 * bloco novo precise entender o resto do app.
 */
export type PropsBloco<P extends Passo = Passo> = {
  passo: P
  /** Índice do passo dentro da lição. Usado para ids de acessibilidade. */
  indice: number
  /** Presente assim que a pessoa envia uma resposta. */
  resposta: Resposta | undefined
  /** Seleção ainda não enviada. Só faz sentido em blocos interativos. */
  selecao: number[]
  aoSelecionar: (selecao: number[]) => void
  /** Falso quando o passo já foi ultrapassado — o bloco fica somente leitura. */
  ativo: boolean
}
