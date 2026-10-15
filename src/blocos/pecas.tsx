/**
 * Peças compartilhadas pelos exercícios de montar resposta.
 *
 * Os quatro blocos de colocação — lacuna, ordenar, associar e classificar —
 * usam o mesmo gesto: **toque para escolher, toque para colocar**. Nenhum deles
 * usa arrastar.
 *
 * Isso é deliberado. Arrastar com o dedo numa tela pequena é impreciso, não
 * funciona com leitor de tela e é inoperável por teclado — e o público está em
 * celular de entrada, com os computadores da Nave como alternativa. Dois toques
 * resolvem o mesmo problema e funcionam em tudo.
 */

import type { ReactNode } from 'react'
import { IconeCerto, IconeErrado } from '@/design/icones'
import { MarcacaoInline } from '@/lib/marcacao'

/* -------------------------------------------------------------------------- */

export function Instrucao({ children }: { children: ReactNode }) {
  return <p className="medida mb-4 text-[1.0625rem] leading-relaxed font-semibold">{children}</p>
}

/** Dica de uso, discreta, logo abaixo da instrução. */
export function Gesto({ children }: { children: ReactNode }) {
  return <p className="text-tinta-fraca mb-4 text-sm">{children}</p>
}

/* -------------------------------------------------------------------------- */

type EstadoPeca = 'neutro' | 'escolhido' | 'usado' | 'certo' | 'errado'

const VISUAL: Record<EstadoPeca, string> = {
  neutro: 'border-linha bg-superficie hover:border-ceu',
  escolhido: 'border-ceu bg-ceu-claro ring-2 ring-ceu',
  usado: 'border-linha-suave bg-superficie-alt text-tinta-fraca',
  certo: 'border-mata bg-mata-claro',
  errado: 'border-terra bg-terra-claro',
}

/**
 * Pedaço tocável de texto: palavra do banco, item para classificar,
 * definição para associar.
 */
export function Peca({
  children,
  estado = 'neutro',
  aoTocar,
  desabilitado = false,
  rotulo,
}: {
  children: ReactNode
  estado?: EstadoPeca
  aoTocar?: () => void
  desabilitado?: boolean
  /** Nome acessível, quando o texto visível não basta sozinho. */
  rotulo?: string
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      disabled={desabilitado || !aoTocar}
      aria-label={rotulo}
      className={`min-h-toque rounded-suave border px-3.5 py-2 text-left text-[0.9375rem] transition-colors disabled:cursor-default ${VISUAL[estado]}`}
    >
      {children}
    </button>
  )
}

/** Marca de acerto ou erro, sempre com ícone e texto — nunca só cor. */
export function Marca({ certo }: { certo: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 text-sm font-medium ${
        certo ? 'text-mata' : 'text-terra'
      }`}
    >
      {certo ? <IconeCerto /> : <IconeErrado />}
      <span className="apenas-leitor">{certo ? 'correto' : 'incorreto'}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Faixa de resultado ao fim do exercício.
 *
 * Quando erra, diz quantos acertou em vez de só "errado" — a pessoa precisa
 * saber se chegou perto ou se entendeu tudo ao contrário.
 */
export function Resultado({
  certo,
  acertos,
  total,
  explicacao,
}: {
  certo: boolean
  acertos?: number
  total?: number
  explicacao?: string
}) {
  const parcial =
    !certo && acertos !== undefined && total !== undefined && acertos > 0
      ? ` Você acertou ${acertos} de ${total}.`
      : ''

  return (
    <div
      role="status"
      className={`medida mt-5 border-l-3 px-4 py-3 ${
        certo ? 'border-l-mata bg-mata-claro' : 'border-l-terra bg-terra-claro'
      }`}
    >
      <p
        className={`flex items-center gap-1.5 font-semibold ${certo ? 'text-mata' : 'text-terra'}`}
      >
        {certo ? <IconeCerto /> : <IconeErrado />}
        {certo ? 'Isso mesmo' : `Ainda não.${parcial}`}
      </p>
      {explicacao && (
        <div className="text-tinta-suave mt-1 text-[0.9375rem] leading-relaxed">
          <MarcacaoInline conteudo={explicacao} />
        </div>
      )}
    </div>
  )
}
