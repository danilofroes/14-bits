import { useEffect, useMemo } from 'react'
import type { PassoOrdenar } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { acertosPorPosicao, embaralharDeslocado } from '@/engine/motor'
import { Gesto, Instrucao, Marca, Resultado } from './pecas'
import { MarcacaoInline } from '@/lib/marcacao'

/**
 * Colocar passos na ordem certa.
 *
 * Em vez de arrastar, cada linha tem botões de subir e descer. É o que funciona
 * com o dedo numa lista apertada, com teclado e com leitor de tela — ver as
 * notas em pecas.tsx.
 */
export function BlocoOrdenar({
  passo,
  indice,
  resposta,
  escolhas,
  aoEscolher,
  ativo,
}: PropsBloco<PassoOrdenar>) {
  const respondido = resposta !== undefined

  /** Ordem inicial: embaralhada e garantidamente sem ninguém no lugar certo. */
  const inicial = useMemo(
    () => embaralharDeslocado(passo.itens.length, indice),
    [passo.itens.length, indice],
  )

  // A ordem só existe depois que o componente informa a inicial para cima.
  useEffect(() => {
    if (!respondido && escolhas.length !== passo.itens.length) aoEscolher(inicial)
  }, [respondido, escolhas.length, passo.itens.length, inicial, aoEscolher])

  const atual = respondido
    ? resposta.escolhas
    : escolhas.length === passo.itens.length
      ? escolhas
      : inicial

  const acertos = respondido ? acertosPorPosicao(passo, resposta.escolhas) : []

  function mover(de: number, para: number) {
    if (!ativo || respondido) return
    if (para < 0 || para >= atual.length) return
    const proxima = [...atual]
    const item = proxima[de]!
    proxima[de] = proxima[para]!
    proxima[para] = item
    aoEscolher(proxima)
  }

  return (
    <div>
      <Instrucao>
        <MarcacaoInline conteudo={passo.instrucao} />
      </Instrucao>
      {ativo && !respondido && <Gesto>Use as setas para subir e descer cada passo.</Gesto>}

      <ol className="flex flex-col gap-2">
        {atual.map((indiceEstavel, posicao) => {
          const certo = acertos[posicao]
          let visual = 'border-linha bg-superficie'
          if (respondido) {
            visual = certo ? 'border-mata bg-mata-claro' : 'border-terra bg-terra-claro'
          }

          return (
            <li
              key={indiceEstavel}
              className={`rounded-suave flex items-center gap-3 border px-3 py-2 transition-colors ${visual}`}
            >
              <span className="text-tinta-fraca w-6 shrink-0 text-center font-mono text-sm tabular-nums">
                {posicao + 1}
              </span>

              <span className="min-w-0 flex-1 text-[0.9375rem] leading-relaxed">
                {passo.itens[indiceEstavel]}
              </span>

              {respondido ? (
                <Marca certo={certo ?? false} />
              ) : (
                <span className="flex shrink-0 flex-col">
                  <BotaoMover
                    direcao="cima"
                    rotulo={`Subir "${passo.itens[indiceEstavel]}"`}
                    desabilitado={!ativo || posicao === 0}
                    aoTocar={() => mover(posicao, posicao - 1)}
                  />
                  <BotaoMover
                    direcao="baixo"
                    rotulo={`Descer "${passo.itens[indiceEstavel]}"`}
                    desabilitado={!ativo || posicao === atual.length - 1}
                    aoTocar={() => mover(posicao, posicao + 1)}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {respondido && (
        <>
          {!resposta.correta && (
            <ol className="mt-5 flex flex-col gap-1.5">
              <li className="text-tinta-fraca mb-1 text-sm font-medium">A ordem certa era:</li>
              {passo.itens.map((item, i) => (
                <li key={i} className="flex gap-2 text-[0.9375rem]">
                  <span className="text-tinta-fraca font-mono tabular-nums">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}
          <Resultado
            certo={resposta.correta}
            acertos={acertos.filter(Boolean).length}
            total={passo.itens.length}
          />
        </>
      )}
    </div>
  )
}

function BotaoMover({
  direcao,
  rotulo,
  desabilitado,
  aoTocar,
}: {
  direcao: 'cima' | 'baixo'
  rotulo: string
  desabilitado: boolean
  aoTocar: () => void
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      disabled={desabilitado}
      aria-label={rotulo}
      className="text-tinta-fraca hover:bg-superficie-alt hover:text-ceu flex h-[22px] w-9 items-center justify-center rounded disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
        <path
          d={direcao === 'cima' ? 'M3.5 10 8 5.5 12.5 10' : 'M3.5 6 8 10.5 12.5 6'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
