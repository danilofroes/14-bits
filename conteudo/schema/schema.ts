/**
 * Schema de conteúdo do 14-Bits — fonte única da verdade.
 *
 * Este arquivo define o formato de toda lição escrita em YAML. Ele é usado em
 * três lugares, e é por isso que vive junto do conteúdo e não dentro de `src/`:
 *
 *   1. o plugin de build, que valida o conteúdo ao carregar;
 *   2. o script `npm run validar`, que roda no CI;
 *   3. o app, que deriva os tipos TypeScript daqui.
 *
 * As chaves são em português porque espelham o que a pessoa escreve no YAML —
 * ver PLANEJAMENTO.md §6.3. Sem acento e sem cedilha em identificadores.
 */

import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/* Blocos                                                                      */
/* -------------------------------------------------------------------------- */

/** Campos aceitos por qualquer passo, independente do tipo. */
const camposComuns = {
  id: z.string().min(1).optional(),
  opcional: z.boolean().default(false),
  conceitos: z.array(z.string()).default([]),
}

const passoTexto = z.object({
  ...camposComuns,
  tipo: z.literal('texto'),
  conteudo: z.string().min(1, 'texto vazio'),
})

const passoDestaque = z.object({
  ...camposComuns,
  tipo: z.literal('destaque'),
  estilo: z.enum(['dica', 'atencao', 'curiosidade']).default('dica'),
  conteudo: z.string().min(1, 'destaque vazio'),
})

const alternativa = z.object({
  texto: z.string().min(1),
  correta: z.boolean().default(false),
  /** Mostrado ao escolher esta alternativa. É onde o ensino realmente acontece. */
  feedback: z.string().optional(),
})

const passoQuiz = z
  .object({
    ...camposComuns,
    tipo: z.literal('quiz'),
    pergunta: z.string().min(1),
    alternativas: z.array(alternativa).min(2, 'quiz precisa de ao menos 2 alternativas'),
    /** Quando true, embaralha a ordem a cada tentativa. */
    embaralhar: z.boolean().default(true),
  })
  .refine((q) => q.alternativas.some((a) => a.correta), {
    message: 'quiz sem nenhuma alternativa correta',
    path: ['alternativas'],
  })
  .refine(
    (q) => new Set(q.alternativas.map((a) => a.texto.trim())).size === q.alternativas.length,
    { message: 'quiz com alternativas duplicadas', path: ['alternativas'] },
  )

export const passo = z.discriminatedUnion('tipo', [passoTexto, passoDestaque]).or(passoQuiz)

/* -------------------------------------------------------------------------- */
/* Lição                                                                       */
/* -------------------------------------------------------------------------- */

/** Acima disto a lição deixa de caber numa sentada. Ver ARQUITETURA-CONTEUDO.md §2. */
export const MAX_PASSOS_RECOMENDADO = 12

export const licao = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id deve ser minúsculo, sem acento, separado por hífen'),
  titulo: z.string().min(1),
  objetivo: z.string().min(1, 'toda lição precisa dizer o que a pessoa sai sabendo'),
  duracao_min: z.number().int().positive().max(15),
  xp: z.number().int().positive().default(10),
  conceitos: z.array(z.string()).default([]),
  passos: z.array(passo).min(1, 'lição sem passos'),
})

/* -------------------------------------------------------------------------- */
/* Trilha                                                                      */
/* -------------------------------------------------------------------------- */

export const modulo = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1),
  licoes: z.array(z.string().min(1)).min(1, 'módulo sem lições'),
})

export const trilha = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id deve ser minúsculo, sem acento, separado por hífen'),
  titulo: z.string().min(1),
  subtitulo: z.string().optional(),
  descricao: z.string().optional(),
  /** Chave do ícone em src/design/icones.tsx */
  icone: z.string().default('trilha'),
  /** Nome do token de cor. Ver src/design/tokens.css */
  cor: z.enum(['ceu', 'latao', 'mata', 'terra']).default('ceu'),
  ordem: z.number().int().nonnegative(),
  /** ids de trilhas que precisam estar concluídas antes desta liberar. */
  requisitos: z.array(z.string()).default([]),
  modulos: z.array(modulo).min(1, 'trilha sem módulos'),
})

/* -------------------------------------------------------------------------- */
/* Tipos derivados — o app importa daqui, nunca redeclara                      */
/* -------------------------------------------------------------------------- */

export type Passo = z.infer<typeof passo>
export type PassoTexto = z.infer<typeof passoTexto>
export type PassoDestaque = z.infer<typeof passoDestaque>
export type PassoQuiz = z.infer<typeof passoQuiz>
export type Alternativa = z.infer<typeof alternativa>
export type Licao = z.infer<typeof licao>
export type Modulo = z.infer<typeof modulo>
export type Trilha = z.infer<typeof trilha>

/** Tipos de passo que exigem resposta para a lição avançar. */
export const TIPOS_INTERATIVOS = ['quiz'] as const

export function exigeResposta(p: Passo): boolean {
  return (TIPOS_INTERATIVOS as readonly string[]).includes(p.tipo) && !p.opcional
}

/** Estrutura montada pelo build: trilhas já com as lições resolvidas. */
export type TrilhaCompleta = Trilha & {
  licoes: Record<string, Licao>
}

export type Conteudo = {
  trilhas: TrilhaCompleta[]
}
