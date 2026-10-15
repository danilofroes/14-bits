/**
 * Registry de blocos — o ponto de extensão do app.
 *
 * Adicionar um tipo de exercício novo é: escrever o componente aqui do lado,
 * registrá-lo neste mapa e acrescentar a variante no schema. Nenhuma outra
 * parte do app precisa saber que ele existe.
 *
 * Ver ARQUITETURA-CONTEUDO.md §4 para o catálogo planejado e a ordem em que
 * os tipos entram.
 */

import type { ComponentType } from 'react'
import type { Passo } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { BlocoTexto } from './BlocoTexto'
import { BlocoDestaque } from './BlocoDestaque'
import { BlocoQuiz } from './BlocoQuiz'
import { BlocoLacuna } from './BlocoLacuna'
import { BlocoOrdenar } from './BlocoOrdenar'
import { BlocoAssociar } from './BlocoAssociar'
import { BlocoClassificar } from './BlocoClassificar'
import { BlocoReflexao } from './BlocoReflexao'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<Passo['tipo'], ComponentType<PropsBloco<any>>> = {
  texto: BlocoTexto,
  destaque: BlocoDestaque,
  quiz: BlocoQuiz,
  lacuna: BlocoLacuna,
  ordenar: BlocoOrdenar,
  associar: BlocoAssociar,
  classificar: BlocoClassificar,
  reflexao: BlocoReflexao,
}

export function Bloco(props: PropsBloco) {
  const Componente = REGISTRY[props.passo.tipo]

  if (!Componente) {
    // Só acontece se o schema aceitar um tipo que ninguém implementou.
    // O validador do CI pega isso antes, mas em dev vale avisar na tela.
    return (
      <p className="border-l-terra bg-terra-claro text-terra border-l-3 px-4 py-3">
        Tipo de bloco sem componente: <code className="font-mono">{props.passo.tipo}</code>
      </p>
    )
  }

  return <Componente {...props} />
}

export { REGISTRY }
