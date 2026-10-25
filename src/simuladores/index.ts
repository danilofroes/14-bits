/**
 * Registro dos simuladores.
 *
 * O nome usado no YAML chega aqui. A lista de nomes válidos e os parâmetros de
 * cada um vivem em `conteudo/schema/simuladores.ts`, onde o validador consegue
 * lê-los sem importar React — então um nome errado quebra o `npm run validar`,
 * não a aula.
 */

import type { ComponentType } from 'react'
import type { IdWidget } from '@conteudo/schema/simuladores.ts'
import { BinarioContador } from './BinarioContador'
import { PortaLogica } from './PortaLogica'
import { FluxoAlgoritmo } from './FluxoAlgoritmo'

export type PropsWidget = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parametros: any
  instrucao: string
  alternativaTexto: string
}

export const WIDGETS: Record<IdWidget, ComponentType<PropsWidget>> = {
  'binario-contador': BinarioContador,
  'porta-logica': PortaLogica,
  'fluxo-algoritmo': FluxoAlgoritmo,
}
