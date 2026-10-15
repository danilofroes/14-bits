import type { PassoReflexao } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { Marcacao, MarcacaoInline } from '@/lib/marcacao'

/**
 * Pergunta aberta, sem correção.
 *
 * Não existe resposta errada e nada é pontuado — o bloco existe para a pessoa
 * sair da lição com uma ideia própria, de preferência para levar à aula. O que
 * ela escreve fica no aparelho dela e reaparece quando volta à lição.
 */
export function BlocoReflexao({
  passo,
  indice,
  resposta,
  texto,
  aoEscrever,
  ativo,
}: PropsBloco<PassoReflexao>) {
  const respondido = resposta !== undefined
  const idCampo = `reflexao-${indice}`

  if (respondido) {
    return (
      <div>
        <p className="medida mb-3 text-[1.0625rem] leading-relaxed font-semibold">
          <MarcacaoInline conteudo={passo.pergunta} />
        </p>

        <blockquote className="medida border-l-latao bg-latao-claro border-l-3 px-4 py-3">
          <p className="text-tinta-suave text-[0.9375rem] leading-relaxed whitespace-pre-wrap">
            {resposta.texto}
          </p>
        </blockquote>

        <p className="text-tinta-fraca mt-2 text-sm">
          Guardado só neste aparelho. Leve essa resposta para a aula.
        </p>
      </div>
    )
  }

  return (
    <div>
      <label
        htmlFor={idCampo}
        className="medida mb-3 block text-[1.0625rem] leading-relaxed font-semibold"
      >
        <MarcacaoInline conteudo={passo.pergunta} />
      </label>

      {passo.dica && (
        <div className="medida text-tinta-fraca mb-3 text-sm">
          <Marcacao conteudo={passo.dica} />
        </div>
      )}

      <textarea
        id={idCampo}
        value={texto}
        onChange={(e) => aoEscrever(e.target.value)}
        disabled={!ativo}
        rows={4}
        placeholder="Escreva o que você pensou…"
        className="medida rounded-suave border-linha bg-superficie placeholder:text-tinta-fraca focus:border-ceu block w-full resize-y border px-3.5 py-3 text-[0.9375rem] leading-relaxed disabled:opacity-60"
      />
    </div>
  )
}
