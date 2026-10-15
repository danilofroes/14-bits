import { useMemo, useState } from 'react'
import type { PassoAssociar } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { VAZIO, acertosPorPosicao, embaralharEstavel, proximaVaga } from '@/engine/motor'
import { Gesto, Instrucao, Marca, Peca, Resultado } from './pecas'
import { MarcacaoInline } from '@/lib/marcacao'

/**
 * Ligar cada termo à sua definição.
 *
 * Duas colunas não cabem em 375px sem virar texto picotado, então o layout é
 * em pilha: os termos ficam em cima, as definições embaixo, e o gesto é o
 * mesmo dos outros exercícios — toque no termo, toque na definição.
 */
export function BlocoAssociar({
  passo,
  indice,
  resposta,
  escolhas,
  aoEscolher,
  ativo,
}: PropsBloco<PassoAssociar>) {
  const respondido = resposta !== undefined
  const [termoAtivo, setTermoAtivo] = useState<number | null>(null)

  const ordemDefinicoes = useMemo(
    () => embaralharEstavel(passo.pares.length, indice + 7),
    [passo.pares.length, indice],
  )

  const atuais = respondido ? resposta.escolhas : escolhas
  const acertos = respondido ? acertosPorPosicao(passo, resposta.escolhas) : []

  function ligacaoDo(termo: number): number {
    return atuais[termo] ?? VAZIO
  }

  function normalizadas(): number[] {
    const saida = atuais.slice(0, passo.pares.length)
    while (saida.length < passo.pares.length) saida.push(VAZIO)
    return saida
  }

  function tocarTermo(termo: number) {
    if (!ativo || respondido) return
    if (ligacaoDo(termo) !== VAZIO) {
      const proximas = normalizadas()
      proximas[termo] = VAZIO
      aoEscolher(proximas)
    }
    setTermoAtivo(termo)
  }

  function tocarDefinicao(definicao: number) {
    if (!ativo || respondido) return
    const proximas = normalizadas()

    // Uma definição só serve a um termo: se já estava ligada, ela se solta.
    const ondeEstava = proximas.indexOf(definicao)
    if (ondeEstava >= 0) proximas[ondeEstava] = VAZIO

    const alvo = termoAtivo ?? proximaVaga(proximas)
    if (alvo === null) return

    proximas[alvo] = definicao
    aoEscolher(proximas)
    setTermoAtivo(proximaVaga(proximas))
  }

  return (
    <div>
      <Instrucao>
        <MarcacaoInline conteudo={passo.instrucao} />
      </Instrucao>
      {ativo && !respondido && (
        <Gesto>Toque num termo e depois na definição que combina com ele.</Gesto>
      )}

      <ul className="flex flex-col gap-2">
        {passo.pares.map((par, termo) => {
          const ligado = ligacaoDo(termo)
          const temLigacao = ligado !== VAZIO
          const certo = acertos[termo]

          let visual = 'border-linha bg-superficie'
          if (respondido) {
            visual = certo ? 'border-mata bg-mata-claro' : 'border-terra bg-terra-claro'
          } else if (termoAtivo === termo) {
            visual = 'border-ceu bg-ceu-claro ring-2 ring-ceu'
          } else if (temLigacao) {
            visual = 'border-ceu bg-ceu-claro'
          }

          return (
            <li key={termo}>
              <button
                type="button"
                onClick={() => tocarTermo(termo)}
                disabled={!ativo || respondido}
                className={`min-h-toque rounded-suave flex w-full items-center gap-3 border px-3.5 py-2.5 text-left transition-colors disabled:cursor-default ${visual}`}
              >
                <span className="shrink-0 font-semibold">{par.termo}</span>
                <span className="text-tinta-fraca" aria-hidden="true">
                  →
                </span>
                <span
                  className={`min-w-0 flex-1 text-[0.9375rem] ${
                    temLigacao ? 'text-tinta-suave' : 'text-tinta-fraca italic'
                  }`}
                >
                  {temLigacao ? passo.pares[ligado]!.definicao : 'escolha uma definição'}
                </span>
                {respondido && <Marca certo={certo ?? false} />}
              </button>
            </li>
          )
        })}
      </ul>

      {!respondido && (
        <div className="mt-5 flex flex-col gap-2" role="group" aria-label="Definições disponíveis">
          {ordemDefinicoes.map((definicao) => {
            const usada = atuais.includes(definicao)
            return (
              <Peca
                key={definicao}
                estado={usada ? 'usado' : 'neutro'}
                aoTocar={ativo && !usada ? () => tocarDefinicao(definicao) : undefined}
                desabilitado={!ativo || usada}
              >
                {passo.pares[definicao]!.definicao}
              </Peca>
            )
          })}
        </div>
      )}

      {respondido && (
        <>
          {!resposta.correta && (
            <ul className="mt-5 flex flex-col gap-1.5 text-[0.9375rem]">
              <li className="text-tinta-fraca mb-1 text-sm font-medium">As ligações certas:</li>
              {passo.pares.map((par, i) => (
                <li key={i}>
                  <strong className="font-semibold">{par.termo}</strong>
                  <span className="text-tinta-fraca"> — {par.definicao}</span>
                </li>
              ))}
            </ul>
          )}
          <Resultado
            certo={resposta.correta}
            acertos={acertos.filter(Boolean).length}
            total={passo.pares.length}
          />
        </>
      )}
    </div>
  )
}
