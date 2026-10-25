import { useMemo, useState } from 'react'
import type { ParametrosFluxoAlgoritmo } from '@conteudo/schema/simuladores.ts'
import { MolduraSimulador } from './Moldura'
import { PROGRAMAS } from './tracos'

/**
 * Executa um algoritmo passo a passo, na frente da pessoa.
 *
 * É o simulador que mais substitui texto: em vez de explicar em três parágrafos
 * por que o primeiro passo precisa existir, a pessoa avança um quadro e vê a
 * variável `maior` nascer com o primeiro número. A nota de cada quadro diz o
 * que mudou e por quê.
 */
export function FluxoAlgoritmo({
  parametros,
  instrucao,
  alternativaTexto,
}: {
  parametros: ParametrosFluxoAlgoritmo
  instrucao: string
  alternativaTexto: string
}) {
  const { programa, dados } = parametros
  const traco = useMemo(() => PROGRAMAS[programa](dados), [programa, dados])

  const [passo, setPasso] = useState(0)
  const quadro = traco.quadros[passo]!
  const ultimo = passo === traco.quadros.length - 1

  return (
    <MolduraSimulador
      instrucao={instrucao}
      alternativaTexto={alternativaTexto}
      narracao={`Passo ${passo + 1} de ${traco.quadros.length}. ${quadro.nota}`}
      aoReiniciar={() => setPasso(0)}
    >
      <div className="flex flex-col gap-5">
        {/* A lista de entrada, com a posição olhada em destaque */}
        <div>
          <p className="text-tinta-fraca mb-2 font-mono text-[0.6875rem] tracking-widest uppercase">
            A lista
          </p>
          <div className="flex flex-wrap gap-1.5">
            {dados.map((numero, i) => {
              const olhando = quadro.olhando === i
              return (
                <span
                  key={i}
                  className={`rounded-suave border px-3 py-2 font-mono text-sm tabular-nums transition-colors ${
                    olhando
                      ? 'border-ceu bg-ceu text-white'
                      : 'border-linha bg-superficie-alt text-tinta-fraca'
                  }`}
                >
                  {numero}
                </span>
              )
            })}
          </div>
        </div>

        {/* O pseudocódigo, com a linha atual acesa */}
        <div>
          <p className="text-tinta-fraca mb-2 font-mono text-[0.6875rem] tracking-widest uppercase">
            O algoritmo
          </p>
          <ol className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed">
            {traco.linhas.map((linha, i) => {
              const atual = quadro.linha === i
              return (
                <li
                  key={i}
                  className={`rounded px-2 py-1 whitespace-pre transition-colors ${
                    atual ? 'bg-ceu-claro text-tinta font-semibold' : 'text-tinta-fraca'
                  }`}
                >
                  <span className={atual ? 'text-ceu' : 'text-linha'}>{atual ? '▸ ' : '  '}</span>
                  {linha}
                </li>
              )
            })}
          </ol>
        </div>

        {/* As variáveis */}
        <div className="border-linha-suave border-t pt-4">
          <p className="text-tinta-fraca mb-2 font-mono text-[0.6875rem] tracking-widest uppercase">
            Na memória
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quadro.variaveis).map(([nome, valor]) => (
              <span
                key={nome}
                className="rounded-suave border-linha bg-papel border px-3 py-1.5 font-mono text-sm"
              >
                <span className="text-tinta-fraca">{nome} = </span>
                <span className="text-tinta font-semibold tabular-nums">{valor}</span>
              </span>
            ))}
          </div>
        </div>

        {/* A nota do quadro atual, visível para todo mundo */}
        <p className="border-l-ceu bg-ceu-claro text-tinta-suave border-l-3 px-4 py-3 text-[0.9375rem] leading-relaxed">
          {quadro.nota}
        </p>

        {/* Navegação */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0}
            className="min-h-toque border-linha rounded-suave hover:border-ceu text-tinta-suave disabled:hover:border-linha border px-4 text-sm font-medium disabled:opacity-40"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => setPasso((p) => Math.min(traco.quadros.length - 1, p + 1))}
            disabled={ultimo}
            className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte disabled:bg-superficie-alt disabled:text-tinta-fraca flex-1 px-4 text-sm font-semibold text-white transition-colors sm:flex-none"
          >
            {ultimo ? 'Fim da execução' : 'Próximo passo'}
          </button>
          <span className="text-tinta-fraca ml-auto font-mono text-xs tabular-nums">
            {passo + 1}/{traco.quadros.length}
          </span>
        </div>
      </div>
    </MolduraSimulador>
  )
}
