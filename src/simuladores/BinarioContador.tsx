import { useState } from 'react'
import type { ParametrosBinarioContador } from '@conteudo/schema/simuladores.ts'
import { Interruptor, MolduraSimulador } from './Moldura'

/**
 * Fileira de bits que vira número.
 *
 * O que a pessoa precisa descobrir aqui não é "binário é 0 e 1" — é que **cada
 * bit vale o dobro do anterior**. Por isso cada interruptor mostra seu valor
 * embaixo (1, 2, 4, 8…) e o total aparece grande: a progressão fica visível
 * em vez de explicada.
 */
export function BinarioContador({
  parametros,
  instrucao,
  alternativaTexto,
}: {
  parametros: ParametrosBinarioContador
  instrucao: string
  alternativaTexto: string
}) {
  const { bits, inicial } = parametros
  const [valor, setValor] = useState(inicial)

  const maximo = 2 ** bits - 1
  const combinacoes = 2 ** bits

  function alternar(posicao: number) {
    setValor((v) => v ^ (1 << posicao))
  }

  // Da esquerda para a direita, do bit mais alto para o mais baixo — como se
  // escreve número.
  const posicoes = Array.from({ length: bits }, (_, i) => bits - 1 - i)
  const ligados = posicoes.filter((p) => (valor >> p) & 1).length

  return (
    <MolduraSimulador
      instrucao={instrucao}
      alternativaTexto={alternativaTexto}
      narracao={`${ligados} de ${bits} bits ligados. Valor ${valor} de ${maximo} possíveis.`}
      aoReiniciar={() => setValor(inicial)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1">
          {posicoes.map((posicao) => {
            const ligado = Boolean((valor >> posicao) & 1)
            const peso = 2 ** posicao
            return (
              <div key={posicao} className="flex flex-col items-center gap-1">
                <Interruptor
                  ligado={ligado}
                  rotulo={`Bit de valor ${peso}`}
                  aoAlternar={() => alternar(posicao)}
                  tamanho="pequeno"
                />
                <span
                  className={`font-mono text-[0.625rem] tabular-nums ${
                    ligado ? 'text-ceu font-semibold' : 'text-tinta-fraca'
                  }`}
                >
                  {peso}
                </span>
              </div>
            )
          })}
        </div>

        <div className="border-linha-suave flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t pt-4">
          <p>
            <span className="text-tinta-fraca mr-2 font-mono text-[0.6875rem] tracking-widest uppercase">
              Valor
            </span>
            <span className="font-display text-3xl font-extrabold tabular-nums">{valor}</span>
          </p>
          <p className="text-tinta-fraca text-sm">
            de <span className="font-mono tabular-nums">{maximo}</span> possíveis — porque{' '}
            <span className="font-mono">{bits}</span> bits dão{' '}
            <span className="text-tinta-suave font-mono font-semibold tabular-nums">
              {combinacoes.toLocaleString('pt-BR')}
            </span>{' '}
            combinações
          </p>
        </div>
      </div>
    </MolduraSimulador>
  )
}
