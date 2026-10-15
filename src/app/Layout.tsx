import { Link, Outlet, useLocation } from 'react-router-dom'
import { useProgresso } from '@/progresso/store'
import { Marca, IconeXp } from '@/design/icones'

export function Layout() {
  const xpTotal = useProgresso((e) => e.xpTotal)
  const ofensiva = useProgresso((e) => e.ofensiva)
  const { pathname } = useLocation()

  // Dentro de uma lição o cabeçalho sai de cena: a tela é da lição.
  const dentroDeLicao = pathname.includes('/licao/')

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="apenas-leitor focus:rounded-suave focus:bg-ceu focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {!dentroDeLicao && (
        <header className="border-linha bg-superficie border-b">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3">
            <Link
              to="/"
              className="text-tinta flex items-center gap-2.5"
              aria-label="14-Bits, página inicial"
            >
              <Marca className="text-ceu h-5 w-8" />
              <span className="font-display text-lg font-extrabold tracking-tight">14-Bits</span>
            </Link>

            <div className="flex items-center gap-4 text-sm">
              <span className="text-latao flex items-center gap-1.5 font-medium">
                <IconeXp />
                <span className="font-mono tabular-nums">{xpTotal}</span>
                <span className="apenas-leitor">pontos de experiência</span>
              </span>
              {ofensiva > 0 && (
                <span className="text-tinta-fraca font-mono tabular-nums">
                  {ofensiva}
                  <span aria-hidden="true"> dia{ofensiva > 1 ? 's' : ''}</span>
                  <span className="apenas-leitor">
                    {' '}
                    dia{ofensiva > 1 ? 's' : ''} seguidos de estudo
                  </span>
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      <main id="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
