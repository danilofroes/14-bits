/**
 * Ícones em SVG inline.
 *
 * Sem biblioteca: cada ícone usado custa alguns bytes e nenhum download. Todos
 * são decorativos por padrão (`aria-hidden`) — quem precisa de rótulo põe um
 * texto com `.apenas-leitor` ao lado.
 */

type Props = { className?: string }

const base = 'inline-block size-[1.125em] shrink-0'

export function IconeCerto({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`${base} ${className}`}>
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconeErrado({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`${base} ${className}`}>
      <path
        d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconeSeta({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`${base} ${className}`}>
      <path
        d="M4 10h11M11 5.5 15.5 10 11 14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconeXp({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`${base} ${className}`}>
      <path
        d="M10 2.5 12.2 7.3l5.3.6-3.9 3.6 1 5.2L10 14.2 5.4 16.7l1-5.2L2.5 7.9l5.3-.6L10 2.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * A marca: a silhueta de caixa do 14-bis vista de lado. Santos Dumont voou
 * 60 metros a 3 de altura em 1906 — o primeiro voo público da história.
 */
export function Marca({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 40 24" fill="none" aria-hidden="true" className={className}>
      {/* célula traseira em caixa */}
      <rect x="20" y="4" width="15" height="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 7.5h15" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* fuselagem */}
      <path d="M5 14h25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* leme dianteiro (canard) */}
      <rect x="3" y="10" width="7" height="5" stroke="currentColor" strokeWidth="1.6" />
      {/* montantes */}
      <path
        d="M23 11v3M32 11v3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}
