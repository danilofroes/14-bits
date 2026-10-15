import { useMemo, useState } from 'react'
import { respostasDaLacuna, MARCA_LACUNA } from '@conteudo/schema/schema.ts'
import type { PassoLacuna } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { VAZIO, acertosPorPosicao, embaralharEstavel, proximaVaga } from '@/engine/motor'
import { Gesto, Instrucao, Marca, Peca, Resultado } from './pecas'
import { MarcacaoInline } from '@/lib/marcacao'

/**
 * Completar lacunas a partir de um banco de palavras.
 *
 * O banco é montado sozinho: respostas certas + distratores, embaralhados.
 * Quem escreve a lição nunca precisa manter as duas listas em sincronia.
 */
export function BlocoLacuna({
  passo,
  indice,
  resposta,
  escolhas,
  aoEscolher,
  ativo,
}: PropsBloco<PassoLacuna>) {
  const respondido = resposta !== undefined
  const [lacunaAtiva, setLacunaAtiva] = useState<number | null>(null)

  const respostas = useMemo(() => respostasDaLacuna(passo.enunciado), [passo.enunciado])

  /** Ordem estável do conteúdo: respostas primeiro, depois distratores. */
  const bancoEstavel = useMemo(
    () => [...respostas, ...passo.distratores],
    [respostas, passo.distratores],
  )

  /** Ordem de exibição, embaralhada mas constante entre renderizações. */
  const ordemExibida = useMemo(
    () => embaralharEstavel(bancoEstavel.length, indice),
    [bancoEstavel.length, indice],
  )

  const atuais = respondido ? resposta.escolhas : escolhas
  const acertos = respondido ? acertosPorPosicao(passo, resposta.escolhas) : []

  /** Partes do enunciado: texto e lacuna alternados. */
  const partes = useMemo(() => passo.enunciado.split(MARCA_LACUNA), [passo.enunciado])

  function valor(posicao: number): number {
    return atuais[posicao] ?? VAZIO
  }

  function tocarLacuna(posicao: number) {
    if (!ativo || respondido) return
    if (valor(posicao) !== VAZIO) {
      // Devolve a palavra ao banco e deixa a lacuna pronta para a próxima.
      const proximas = [...atuais]
      proximas[posicao] = VAZIO
      aoEscolher(preencherAte(proximas, respostas.length))
    }
    setLacunaAtiva(posicao)
  }

  function tocarPalavra(indiceEstavel: number) {
    if (!ativo || respondido) return
    const proximas = preencherAte([...atuais], respostas.length)

    // Se a palavra já estava em outra lacuna, ela sai de lá.
    const ondeEstava = proximas.indexOf(indiceEstavel)
    if (ondeEstava >= 0) proximas[ondeEstava] = VAZIO

    const alvo = lacunaAtiva ?? proximaVaga(proximas)
    if (alvo === null) return

    proximas[alvo] = indiceEstavel
    aoEscolher(proximas)
    setLacunaAtiva(proximaVaga(proximas))
  }

  return (
    <div>
      <Instrucao>Complete com as palavras certas.</Instrucao>
      {ativo && !respondido && (
        <Gesto>Toque numa palavra para encaixar. Toque numa lacuna preenchida para desfazer.</Gesto>
      )}

      <p className="medida text-tinta-suave text-[1.0625rem] leading-[2.2]">
        {partes.map((parte, i) => {
          // split() com grupo de captura alterna: texto, captura, texto...
          const ehLacuna = i % 2 === 1
          if (!ehLacuna) return <MarcacaoInline key={i} conteudo={parte ?? ''} />

          const posicao = (i - 1) / 2
          const indiceEstavel = valor(posicao)
          const preenchida = indiceEstavel !== VAZIO
          const certa = acertos[posicao]

          let visual = 'border-dashed border-linha text-tinta-fraca'
          if (respondido) {
            visual = certa
              ? 'border-mata bg-mata-claro text-mata'
              : 'border-terra bg-terra-claro text-terra'
          } else if (lacunaAtiva === posicao) {
            visual = 'border-ceu bg-ceu-claro ring-2 ring-ceu text-tinta'
          } else if (preenchida) {
            visual = 'border-ceu bg-ceu-claro text-tinta'
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => tocarLacuna(posicao)}
              disabled={!ativo || respondido}
              aria-label={
                preenchida
                  ? `Lacuna ${posicao + 1}, preenchida com ${bancoEstavel[indiceEstavel]}`
                  : `Lacuna ${posicao + 1}, vazia`
              }
              className={`rounded-suave mx-1 inline-flex min-w-28 items-center justify-center border-2 px-3 py-1 align-middle text-[0.9375rem] font-medium disabled:cursor-default ${visual}`}
            >
              {preenchida ? bancoEstavel[indiceEstavel] : ' '}
            </button>
          )
        })}
      </p>

      {!respondido && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Banco de palavras">
          {ordemExibida.map((indiceEstavel) => {
            const usada = atuais.includes(indiceEstavel)
            return (
              <Peca
                key={indiceEstavel}
                estado={usada ? 'usado' : 'neutro'}
                aoTocar={ativo && !usada ? () => tocarPalavra(indiceEstavel) : undefined}
                desabilitado={!ativo || usada}
              >
                {bancoEstavel[indiceEstavel]}
              </Peca>
            )
          })}
        </div>
      )}

      {respondido && (
        <>
          {!resposta.correta && (
            <ul className="mt-5 flex flex-col gap-1.5">
              {respostas.map((certa, posicao) => (
                <li key={posicao} className="flex items-center gap-2 text-[0.9375rem]">
                  <Marca certo={acertos[posicao] ?? false} />
                  <span className="text-tinta-fraca">Lacuna {posicao + 1}:</span>
                  <strong className="font-semibold">{certa}</strong>
                </li>
              ))}
            </ul>
          )}
          <Resultado
            certo={resposta.correta}
            acertos={acertos.filter(Boolean).length}
            total={respostas.length}
          />
        </>
      )}
    </div>
  )
}

/** Garante um array do tamanho certo, com -1 nas posições que faltam. */
function preencherAte(valores: number[], tamanho: number): number[] {
  const saida = valores.slice(0, tamanho)
  while (saida.length < tamanho) saida.push(VAZIO)
  return saida
}
