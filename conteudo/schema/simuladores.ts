/**
 * Catálogo de simuladores e os parâmetros que cada um aceita.
 *
 * Vive junto do schema, e não dentro de `src/simuladores/`, porque o validador
 * de conteúdo roda em Node e precisa checar os parâmetros sem importar React.
 * O componente e o YAML passam a ter uma fonte só da verdade: errar o nome de
 * um parâmetro quebra o build, não a aula.
 */

import { z } from 'zod'

/* -------------------------------------------------------------------------- */

const binarioContador = z.object({
  /** Quantos bits a fileira mostra. 14 é a piada do nome do app. */
  bits: z.number().int().min(1).max(16).default(8),
  /** Começar com algum bit ligado dá um ponto de partida em vez de tela morta. */
  inicial: z.number().int().nonnegative().default(0),
})

const portaLogica = z.object({
  /** Operadores que a pessoa pode alternar. */
  operadores: z
    .array(z.enum(['E', 'OU', 'NAO']))
    .min(1)
    .default(['E', 'OU', 'NAO']),
  /** Rótulos das entradas, para casar com o exemplo da lição. */
  entrada_a: z.string().min(1).default('choveu'),
  entrada_b: z.string().min(1).default('fez frio'),
})

const fluxoAlgoritmo = z.object({
  /** Qual algoritmo acompanhar. Cada um tem seu gerador em `tracos.ts`. */
  programa: z.enum(['maior-de-uma-lista']).default('maior-de-uma-lista'),
  /** Os números de entrada. Poucos, para a execução caber na cabeça. */
  dados: z.array(z.number()).min(2).max(8).default([23, 31, 27, 35, 29]),
})

/* -------------------------------------------------------------------------- */

/**
 * O registro é a lista oficial. Um `widget` que não esteja aqui é erro de
 * conteúdo, pego pelo `npm run validar`.
 */
export const PARAMETROS_POR_WIDGET = {
  'binario-contador': binarioContador,
  'porta-logica': portaLogica,
  'fluxo-algoritmo': fluxoAlgoritmo,
} as const

export type IdWidget = keyof typeof PARAMETROS_POR_WIDGET

export const IDS_DE_WIDGET = Object.keys(PARAMETROS_POR_WIDGET) as IdWidget[]

export type ParametrosBinarioContador = z.infer<typeof binarioContador>
export type ParametrosPortaLogica = z.infer<typeof portaLogica>
export type ParametrosFluxoAlgoritmo = z.infer<typeof fluxoAlgoritmo>
