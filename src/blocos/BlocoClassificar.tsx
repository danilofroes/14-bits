import { useMemo, useState } from 'react'
import type { PassoClassificar } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { VAZIO, acertosPorPosicao, embaralharEstavel } from '@/engine/motor'
import { Gesto, Instrucao, Marca, Peca, Resultado } from './pecas'
import { MarcacaoInline } from '@/lib/marcacao'

/**
 * Separar itens em categorias.
 *
 * É o exercício que melhor ensina distinção — "isto é classificação ou
 * regressão?" vira uma pergunta que a pessoa responde com a mão, não lendo a
 * definição de novo.
 */
export function BlocoClassificar({
  passo,
  indice,
  resposta,
  escolhas,
  aoEscolher,
  ativo,
}: PropsBloco<PassoClassificar>) {
  const respondido = resposta !== undefined
  const [itemAtivo, setItemAtivo] = useState<number | null>(null)

  const ordemItens = useMemo(
    () => embaralharEstavel(passo.itens.length, indice + 13),
    [passo.itens.length, indice],
  )

  const atuais = respondido ? resposta.escolhas : escolhas
  const acertos = respondido ? acertosPorPosicao(passo, resposta.escolhas) : []

  function categoriaDe(item: number): number {
    return atuais[item] ?? VAZIO
  }

  function normalizadas(): number[] {
    const saida = atuais.slice(0, passo.itens.length)
    while (saida.length < passo.itens.length) saida.push(VAZIO)
    return saida
  }

  function tocarItem(item: number) {
    if (!ativo || respondido) return
    if (categoriaDe(item) !== VAZIO) {
      // Item já classificado volta para a bandeja, já selecionado.
      const proximas = normalizadas()
      proximas[item] = VAZIO
      aoEscolher(proximas)
      setItemAtivo(item)
      return
    }
    setItemAtivo(itemAtivo === item ? null : item)
  }

  function tocarCategoria(categoria: number) {
    if (!ativo || respondido || itemAtivo === null) return
    const proximas = normalizadas()
    proximas[itemAtivo] = categoria
    aoEscolher(proximas)

    // Nada de adiantar a escolha do próximo item. Quem escolhe qual item vai
    // agora é a pessoa — e se o app adivinhasse, o toque dela no item que
    // queria viraria um toque de "desmarcar".
    setItemAtivo(null)
  }

  const naBandeja = ordemItens.filter((i) => categoriaDe(i) === VAZIO)

  return (
    <div>
      <Instrucao>
        <MarcacaoInline conteudo={passo.instrucao} />
      </Instrucao>
      {ativo && !respondido && <Gesto>Toque num item e depois na caixa onde ele se encaixa.</Gesto>}

      {!respondido && (
        <div
          className="rounded-cartao border-linha mb-5 flex min-h-14 flex-wrap items-start gap-2 border border-dashed p-3"
          role="group"
          aria-label="Itens ainda não classificados"
        >
          {naBandeja.length === 0 ? (
            <p className="text-tinta-fraca px-1 py-2 text-sm">
              Tudo classificado. Confira e toque em Verificar.
            </p>
          ) : (
            naBandeja.map((item) => (
              <Peca
                key={item}
                estado={itemAtivo === item ? 'escolhido' : 'neutro'}
                aoTocar={ativo ? () => tocarItem(item) : undefined}
                desabilitado={!ativo}
              >
                {passo.itens[item]!.texto}
              </Peca>
            ))
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {passo.categorias.map((categoria, indiceCategoria) => {
          const dentro = passo.itens
            .map((_, item) => item)
            .filter((item) => categoriaDe(item) === indiceCategoria)

          const recebendo = itemAtivo !== null && !respondido

          return (
            <section
              key={categoria}
              className={`rounded-cartao border p-3 transition-colors ${
                recebendo ? 'border-ceu bg-ceu-claro' : 'border-linha bg-superficie'
              }`}
            >
              <h3 className="text-tinta-fraca mb-2 font-mono text-[0.6875rem] tracking-widest uppercase">
                {categoria}
              </h3>

              {recebendo && (
                <button
                  type="button"
                  onClick={() => tocarCategoria(indiceCategoria)}
                  className="min-h-toque rounded-suave border-ceu text-ceu hover:bg-superficie mb-2 w-full border border-dashed px-3 py-2 text-sm font-medium"
                >
                  Colocar aqui
                </button>
              )}

              <ul className="flex flex-col gap-2">
                {dentro.length === 0 && !recebendo && (
                  <li className="text-tinta-fraca px-1 py-1 text-sm">vazio</li>
                )}
                {dentro.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Peca
                      estado={respondido ? (acertos[item] ? 'certo' : 'errado') : 'neutro'}
                      aoTocar={ativo && !respondido ? () => tocarItem(item) : undefined}
                      desabilitado={!ativo || respondido}
                      rotulo={
                        respondido
                          ? undefined
                          : `Tirar "${passo.itens[item]!.texto}" de ${categoria}`
                      }
                    >
                      {passo.itens[item]!.texto}
                    </Peca>
                    {respondido && <Marca certo={acertos[item] ?? false} />}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {respondido && (
        <>
          {!resposta.correta && (
            <ul className="mt-5 flex flex-col gap-1.5 text-[0.9375rem]">
              <li className="text-tinta-fraca mb-1 text-sm font-medium">
                O lugar certo de cada um:
              </li>
              {passo.itens.map((item, i) => (
                <li key={i}>
                  <span>{item.texto}</span>
                  <span className="text-tinta-fraca"> — {item.categoria}</span>
                </li>
              ))}
            </ul>
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
