import { useMemo } from 'react'
import type { PassoQuiz } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { Marcacao, MarcacaoInline } from '@/lib/marcacao'
import { IconeCerto, IconeErrado } from '@/design/icones'

/**
 * Embaralhamento estável: a ordem muda entre lições, mas não a cada
 * renderização — caso contrário as alternativas dançariam sob o dedo da pessoa.
 */
function embaralharEstavel(tamanho: number, semente: number): number[] {
  const indices = Array.from({ length: tamanho }, (_, i) => i)
  let estado = semente
  for (let i = tamanho - 1; i > 0; i--) {
    estado = (estado * 1664525 + 1013904223) % 4294967296
    const j = estado % (i + 1)
    const a = indices[i]!
    const b = indices[j]!
    indices[i] = b
    indices[j] = a
  }
  return indices
}

export function BlocoQuiz({
  passo,
  indice,
  resposta,
  selecao,
  aoSelecionar,
  ativo,
}: PropsBloco<PassoQuiz>) {
  const multipla = passo.alternativas.filter((a) => a.correta).length > 1
  const respondido = resposta !== undefined
  const idGrupo = `quiz-${indice}`

  // `passo` vem do módulo de conteúdo, que é imutável — a referência do array
  // é estável entre renderizações, então dá para depender dele diretamente.
  const ordem = useMemo(
    () =>
      passo.embaralhar
        ? embaralharEstavel(passo.alternativas.length, indice + 1)
        : passo.alternativas.map((_, i) => i),
    [passo.embaralhar, passo.alternativas, indice],
  )

  function alternar(indiceAlternativa: number) {
    if (!ativo || respondido) return
    if (multipla) {
      aoSelecionar(
        selecao.includes(indiceAlternativa)
          ? selecao.filter((i) => i !== indiceAlternativa)
          : [...selecao, indiceAlternativa],
      )
    } else {
      aoSelecionar([indiceAlternativa])
    }
  }

  return (
    <div>
      <fieldset disabled={!ativo || respondido}>
        <legend className="medida mb-1 text-[1.0625rem] leading-relaxed font-semibold">
          <MarcacaoInline conteudo={passo.pergunta} />
        </legend>
        {multipla && (
          <p className="text-tinta-fraca mb-3 text-sm">Pode haver mais de uma resposta certa.</p>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {ordem.map((indiceAlternativa) => {
            const alternativa = passo.alternativas[indiceAlternativa]!
            const escolhida = selecao.includes(indiceAlternativa)
            const mostrarComoCerta = respondido && alternativa.correta
            const mostrarComoErrada = respondido && escolhida && !alternativa.correta

            let visual = 'border-linha bg-superficie hover:border-ceu'
            if (mostrarComoCerta) visual = 'border-mata bg-mata-claro'
            else if (mostrarComoErrada) visual = 'border-terra bg-terra-claro'
            else if (escolhida) visual = 'border-ceu bg-ceu-claro'
            else if (respondido) visual = 'border-linha bg-superficie opacity-60'

            return (
              <label
                key={indiceAlternativa}
                className={`min-h-toque rounded-suave flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${visual} ${
                  respondido ? 'cursor-default' : ''
                }`}
              >
                <input
                  type={multipla ? 'checkbox' : 'radio'}
                  name={idGrupo}
                  checked={escolhida}
                  onChange={() => alternar(indiceAlternativa)}
                  className="accent-ceu mt-1 size-4 shrink-0"
                />
                <span className="flex-1 leading-relaxed">
                  <MarcacaoInline conteudo={alternativa.texto} />
                </span>

                {/* Ícone e texto, nunca só cor — §6.2 */}
                {mostrarComoCerta && (
                  <span className="text-mata flex shrink-0 items-center gap-1 text-sm font-medium">
                    <IconeCerto />
                    <span className="apenas-leitor">Alternativa correta</span>
                  </span>
                )}
                {mostrarComoErrada && (
                  <span className="text-terra flex shrink-0 items-center gap-1 text-sm font-medium">
                    <IconeErrado />
                    <span className="apenas-leitor">Sua escolha, incorreta</span>
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      {respondido && (
        <div
          role="status"
          className={`medida mt-4 border-l-3 px-4 py-3 ${
            resposta.correta ? 'border-l-mata bg-mata-claro' : 'border-l-terra bg-terra-claro'
          }`}
        >
          <p
            className={`mb-1 flex items-center gap-1.5 font-semibold ${
              resposta.correta ? 'text-mata' : 'text-terra'
            }`}
          >
            {resposta.correta ? <IconeCerto /> : <IconeErrado />}
            {resposta.correta ? 'Isso mesmo' : 'Ainda não é essa'}
          </p>

          {/* Explica a escolha da pessoa; se ela não veio com feedback próprio,
              explica a correta. O erro precisa ensinar alguma coisa. */}
          {feedbackRelevante(passo, resposta.escolhas).map((texto, i) => (
            <div key={i} className="[&_p]:text-tinta-suave text-[0.9375rem] leading-relaxed">
              <Marcacao conteudo={texto} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function feedbackRelevante(passo: PassoQuiz, escolhas: number[]): string[] {
  const daEscolha = escolhas
    .map((i) => passo.alternativas[i]?.feedback)
    .filter((f): f is string => Boolean(f))

  if (daEscolha.length > 0) return daEscolha

  return passo.alternativas
    .filter((a) => a.correta && a.feedback)
    .map((a) => a.feedback!)
    .slice(0, 1)
}
