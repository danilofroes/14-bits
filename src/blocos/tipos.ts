import type { Passo } from '@conteudo/schema/schema.ts'
import type { Resposta } from '@/engine/motor'

/**
 * Contrato de todo bloco.
 *
 * Um bloco recebe o passo, o que já foi respondido e a resposta em andamento —
 * e nunca fala com o store de progresso nem com o roteador. Isso é o que
 * permite testar cada tipo de exercício isoladamente e o que impede que um
 * bloco novo precise entender o resto do app.
 */
export type PropsBloco<P extends Passo = Passo> = {
  passo: P
  /** Índice do passo dentro da lição. Serve de semente do embaralhamento e de id. */
  indice: number
  /** Presente assim que a pessoa envia uma resposta. */
  resposta: Resposta | undefined
  /** Escolhas ainda não enviadas. Índices estáveis do conteúdo; -1 = vazio. */
  escolhas: number[]
  aoEscolher: (escolhas: number[]) => void
  /** Texto em andamento. Só `reflexao` usa. */
  texto: string
  aoEscrever: (texto: string) => void
  /** Falso quando o passo já foi ultrapassado — o bloco fica somente leitura. */
  ativo: boolean
}
