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
import { IDS_DE_WIDGET, PARAMETROS_POR_WIDGET } from './simuladores.ts'
import type { IdWidget } from './simuladores.ts'

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

/* --- lacuna --------------------------------------------------------------- */

/** Marcação das lacunas no enunciado: `{{resposta}}`. */
export const MARCA_LACUNA = /\{\{([^{}]+)\}\}/g

/** Extrai as respostas na ordem em que aparecem no enunciado. */
export function respostasDaLacuna(enunciado: string): string[] {
  return [...enunciado.matchAll(MARCA_LACUNA)].map((m) => m[1]!.trim())
}

const passoLacuna = z
  .object({
    ...camposComuns,
    tipo: z.literal('lacuna'),
    /** As lacunas são escritas direto no texto: `chamamos de {{classificação}}`. */
    enunciado: z.string().min(1),
    /**
     * Palavras erradas que entram no banco junto das respostas. O banco é
     * montado sozinho — assim é impossível escrever uma resposta que não
     * existe entre as opções.
     */
    distratores: z.array(z.string().min(1)).default([]),
  })
  .refine((l) => respostasDaLacuna(l.enunciado).length > 0, {
    message: 'lacuna sem nenhuma marcação {{resposta}} no enunciado',
    path: ['enunciado'],
  })
  .refine(
    (l) => {
      const todas = [...respostasDaLacuna(l.enunciado), ...l.distratores]
      return new Set(todas.map((p) => p.toLowerCase())).size === todas.length
    },
    { message: 'palavra repetida entre respostas e distratores', path: ['distratores'] },
  )

/* --- ordenar -------------------------------------------------------------- */

const passoOrdenar = z
  .object({
    ...camposComuns,
    tipo: z.literal('ordenar'),
    instrucao: z.string().min(1),
    /** A ordem escrita aqui é a correta. Na tela aparece embaralhada. */
    itens: z.array(z.string().min(1)).min(2, 'ordenar precisa de ao menos 2 itens'),
  })
  .refine((o) => new Set(o.itens.map((i) => i.trim())).size === o.itens.length, {
    message: 'itens repetidos — não daria para saber qual vai em qual posição',
    path: ['itens'],
  })

/* --- associar ------------------------------------------------------------- */

const parAssociado = z.object({
  termo: z.string().min(1),
  definicao: z.string().min(1),
})

const passoAssociar = z
  .object({
    ...camposComuns,
    tipo: z.literal('associar'),
    instrucao: z.string().min(1),
    pares: z.array(parAssociado).min(2, 'associar precisa de ao menos 2 pares'),
  })
  .refine((a) => new Set(a.pares.map((p) => p.definicao.trim())).size === a.pares.length, {
    message: 'duas definições iguais — a associação ficaria ambígua',
    path: ['pares'],
  })

/* --- classificar ---------------------------------------------------------- */

const itemClassificavel = z.object({
  texto: z.string().min(1),
  categoria: z.string().min(1),
})

const passoClassificar = z
  .object({
    ...camposComuns,
    tipo: z.literal('classificar'),
    instrucao: z.string().min(1),
    categorias: z.array(z.string().min(1)).min(2, 'classificar precisa de ao menos 2 categorias'),
    itens: z.array(itemClassificavel).min(2, 'classificar precisa de ao menos 2 itens'),
  })
  .refine((c) => c.itens.every((i) => c.categorias.includes(i.categoria)), {
    message: 'algum item aponta para uma categoria que não foi declarada',
    path: ['itens'],
  })
  .refine((c) => new Set(c.categorias).size === c.categorias.length, {
    message: 'categoria repetida',
    path: ['categorias'],
  })

/* --- simulador ------------------------------------------------------------ */

/**
 * Widget interativo. É o que separa o app de um formulário de quiz.
 *
 * Todo simulador carrega `alternativa_texto` obrigatório — a descrição que um
 * leitor de tela lê no lugar do gráfico. Sem isso o exercício simplesmente não
 * existe para quem não enxerga, e por isso o campo não é opcional.
 */
const passoSimulador = z
  .object({
    ...camposComuns,
    tipo: z.literal('simulador'),
    widget: z.string().min(1),
    instrucao: z.string().min(1),
    parametros: z.record(z.string(), z.unknown()).default({}),
    alternativa_texto: z
      .string()
      .min(20, 'descreva o que o simulador mostra, para quem usa leitor de tela'),
    /** Pergunta solta depois do widget, sem correção. */
    pergunta_apos: z.string().optional(),
  })
  .superRefine((passo, ctx) => {
    const esquema = PARAMETROS_POR_WIDGET[passo.widget as IdWidget]

    if (!esquema) {
      ctx.addIssue({
        code: 'custom',
        path: ['widget'],
        message: `simulador "${passo.widget}" não existe. Disponíveis: ${IDS_DE_WIDGET.join(', ')}`,
      })
      return
    }

    const analise = esquema.safeParse(passo.parametros)
    if (!analise.success) {
      for (const problema of analise.error.issues) {
        ctx.addIssue({
          code: 'custom',
          path: ['parametros', ...problema.path],
          message: problema.message,
        })
      }
    }
  })

/* --- reflexao ------------------------------------------------------------- */

/**
 * Pergunta aberta, sem correção. O que a pessoa escreve fica no aparelho dela
 * e reaparece na lição — a ideia é que ela leve a própria resposta para a aula.
 */
const passoReflexao = z.object({
  ...camposComuns,
  tipo: z.literal('reflexao'),
  pergunta: z.string().min(1),
  dica: z.string().optional(),
})

/* -------------------------------------------------------------------------- */

export const passo = z
  .discriminatedUnion('tipo', [passoTexto, passoDestaque, passoReflexao])
  .or(passoQuiz)
  .or(passoLacuna)
  .or(passoOrdenar)
  .or(passoAssociar)
  .or(passoClassificar)
  .or(passoSimulador)

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
export type PassoLacuna = z.infer<typeof passoLacuna>
export type PassoOrdenar = z.infer<typeof passoOrdenar>
export type PassoAssociar = z.infer<typeof passoAssociar>
export type PassoClassificar = z.infer<typeof passoClassificar>
export type PassoReflexao = z.infer<typeof passoReflexao>
export type PassoSimulador = z.infer<typeof passoSimulador>
export type Alternativa = z.infer<typeof alternativa>
export type ParAssociado = z.infer<typeof parAssociado>
export type ItemClassificavel = z.infer<typeof itemClassificavel>
export type Licao = z.infer<typeof licao>
export type Modulo = z.infer<typeof modulo>
export type Trilha = z.infer<typeof trilha>

/** Passos que são corrigidos: exigem resposta certa para liberar o avanço. */
export const TIPOS_CORRIGIDOS = ['quiz', 'lacuna', 'ordenar', 'associar', 'classificar'] as const

/** Passos que pedem alguma ação, corrigida ou não. */
export const TIPOS_INTERATIVOS = [...TIPOS_CORRIGIDOS, 'reflexao'] as const

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
