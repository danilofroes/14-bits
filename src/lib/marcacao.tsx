/**
 * Marcação mínima para o texto das lições.
 *
 * Aceita só `**negrito**`, `*itálico*` e `` `código` ``, separando parágrafos
 * por linha em branco. É deliberadamente pequeno: uma biblioteca de Markdown
 * completa custaria mais que todo o resto do orçamento de JS (§6.2), e nenhuma
 * lição precisa de tabela ou imagem dentro do corpo — para isso existem blocos
 * próprios.
 *
 * Devolve elementos React, nunca HTML cru, então não há caminho para injeção.
 */

import type { ReactNode } from 'react'

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

function renderizarInline(texto: string, chaveBase: string): ReactNode[] {
  const partes = texto.split(INLINE).filter((p) => p !== '')

  return partes.map((parte, i) => {
    const chave = `${chaveBase}-${i}`

    if (parte.startsWith('**') && parte.endsWith('**')) {
      return (
        <strong key={chave} className="text-tinta font-semibold">
          {parte.slice(2, -2)}
        </strong>
      )
    }
    if (parte.startsWith('*') && parte.endsWith('*')) {
      return <em key={chave}>{parte.slice(1, -1)}</em>
    }
    if (parte.startsWith('`') && parte.endsWith('`')) {
      return (
        <code
          key={chave}
          className="bg-superficie-alt rounded px-1.5 py-0.5 font-mono text-[0.9em]"
        >
          {parte.slice(1, -1)}
        </code>
      )
    }
    return parte
  })
}

/** Texto em bloco: quebra em parágrafos. Para corpo de lição e feedback. */
export function Marcacao({ conteudo }: { conteudo: string }) {
  const paragrafos = conteudo
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '')

  return (
    <>
      {paragrafos.map((paragrafo, i) => (
        <p key={i} className="medida text-tinta-suave [&+p]:mt-4">
          {renderizarInline(paragrafo, String(i))}
        </p>
      ))}
    </>
  )
}

/**
 * Mesma marcação, sem envolver em `<p>`.
 *
 * Existe para lugares onde um parágrafo seria HTML inválido ou atrapalharia o
 * nome acessível — dentro de `<legend>` e de `<label>`, por exemplo. Quebras
 * de linha simples viram espaço, porque nesses lugares o texto é sempre curto.
 */
export function MarcacaoInline({ conteudo }: { conteudo: string }) {
  return <>{renderizarInline(conteudo.replace(/\s*\n\s*/g, ' ').trim(), 'i')}</>
}
