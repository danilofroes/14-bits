import { useState } from 'react'
import type { ParametrosPortaLogica } from '@conteudo/schema/simuladores.ts'
import { Interruptor, MolduraSimulador } from './Moldura'

type Operador = 'E' | 'OU' | 'NAO'

const NOME: Record<Operador, string> = { E: 'E', OU: 'OU', NAO: 'NÃO' }

function calcular(operador: Operador, a: boolean, b: boolean): boolean {
  if (operador === 'E') return a && b
  if (operador === 'OU') return a || b
  return !a
}

/**
 * Operadores lógicos com tabela-verdade ao vivo.
 *
 * A tabela inteira fica visível e a linha atual acende conforme a pessoa mexe
 * nos interruptores. É isso que transforma "OU inclui os dois" de frase
 * decorada em coisa observada: dá para ver a linha `1 1` dando verdadeiro.
 */
export function PortaLogica({
  parametros,
  instrucao,
  alternativaTexto,
}: {
  parametros: ParametrosPortaLogica
  instrucao: string
  alternativaTexto: string
}) {
  const { operadores, entrada_a, entrada_b } = parametros
  const primeiro = (operadores[0] ?? 'E') as Operador

  const [operador, setOperador] = useState<Operador>(primeiro)
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)

  const unario = operador === 'NAO'
  const saida = calcular(operador, a, b)

  const linhas: Array<[boolean, boolean]> = unario
    ? [
        [false, false],
        [true, false],
      ]
    : [
        [false, false],
        [false, true],
        [true, false],
        [true, true],
      ]

  const expressao = unario ? `NÃO ${entrada_a}` : `${entrada_a} ${NOME[operador]} ${entrada_b}`

  function reiniciar() {
    setOperador(primeiro)
    setA(true)
    setB(false)
  }

  return (
    <MolduraSimulador
      instrucao={instrucao}
      alternativaTexto={alternativaTexto}
      narracao={`${expressao}, com ${entrada_a} ${a ? 'verdadeiro' : 'falso'}${
        unario ? '' : ` e ${entrada_b} ${b ? 'verdadeiro' : 'falso'}`
      }, dá ${saida ? 'verdadeiro' : 'falso'}.`}
      aoReiniciar={reiniciar}
    >
      <div className="flex flex-col gap-5">
        {operadores.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {operadores.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setOperador(op as Operador)}
                aria-pressed={operador === op}
                className={`min-h-toque rounded-suave border px-5 font-mono font-semibold transition-colors ${
                  operador === op
                    ? 'border-ceu bg-ceu-claro text-ceu'
                    : 'border-linha text-tinta-fraca hover:border-ceu'
                }`}
              >
                {NOME[op as Operador]}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <Entrada rotulo={entrada_a} ligado={a} aoAlternar={() => setA((v) => !v)} />
          {!unario && <Entrada rotulo={entrada_b} ligado={b} aoAlternar={() => setB((v) => !v)} />}

          <div className="flex flex-col gap-1">
            <span className="text-tinta-fraca font-mono text-[0.6875rem] tracking-widest uppercase">
              Resultado
            </span>
            <span
              className={`rounded-suave min-h-toque flex items-center px-4 font-semibold ${
                saida ? 'bg-mata-claro text-mata' : 'bg-terra-claro text-terra'
              }`}
            >
              {saida ? 'verdadeiro' : 'falso'}
            </span>
          </div>
        </div>

        <div className="border-linha-suave border-t pt-4">
          <p className="text-tinta-fraca mb-2 font-mono text-[0.6875rem] tracking-widest uppercase">
            Todas as combinações
          </p>
          <table className="w-full max-w-sm text-sm">
            <thead>
              <tr className="text-tinta-fraca text-left">
                <th className="py-1 pr-3 font-medium">{entrada_a}</th>
                {!unario && <th className="py-1 pr-3 font-medium">{entrada_b}</th>}
                <th className="py-1 font-medium">{expressao}</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {linhas.map(([la, lb]) => {
                const atual = la === a && (unario || lb === b)
                const resultado = calcular(operador, la, lb)
                return (
                  <tr
                    key={`${la}-${lb}`}
                    className={atual ? 'bg-ceu-claro text-tinta font-semibold' : 'text-tinta-fraca'}
                  >
                    <td className="rounded-l py-1.5 pr-3 pl-2">{la ? 'V' : 'F'}</td>
                    {!unario && <td className="py-1.5 pr-3">{lb ? 'V' : 'F'}</td>}
                    <td
                      className={`rounded-r py-1.5 pr-2 ${
                        atual ? (resultado ? 'text-mata' : 'text-terra') : ''
                      }`}
                    >
                      {resultado ? 'V' : 'F'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MolduraSimulador>
  )
}

function Entrada({
  rotulo,
  ligado,
  aoAlternar,
}: {
  rotulo: string
  ligado: boolean
  aoAlternar: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-tinta-fraca font-mono text-[0.6875rem] tracking-widest uppercase">
        {rotulo}
      </span>
      <Interruptor
        ligado={ligado}
        rotulo={`${rotulo}: agora ${ligado ? 'verdadeiro' : 'falso'}`}
        texto={ligado ? 'verdadeiro' : 'falso'}
        aoAlternar={aoAlternar}
      />
    </div>
  )
}
