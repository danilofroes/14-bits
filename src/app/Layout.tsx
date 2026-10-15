import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useProgresso } from '@/progresso/store'
import { useConta } from '@/conta/store'
import { temApi } from '@/conta/api'
import { Marca, IconeXp } from '@/design/icones'

export function Layout() {
  const xpTotal = useProgresso((e) => e.xpTotal)
  const ofensiva = useProgresso((e) => e.ofensiva)
  const { pathname } = useLocation()

  // Dentro de uma lição, e nas telas de conta, o cabeçalho sai de cena.
  const semCabecalho =
    pathname.includes('/licao/') || pathname === '/entrar' || pathname === '/criar-conta'

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="apenas-leitor focus:bg-ceu focus:rounded-suave focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {!semCabecalho && (
        <header className="border-linha bg-superficie border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
            <Link
              to="/"
              className="text-tinta min-h-toque flex items-center gap-2.5"
              aria-label="14-Bits, página inicial"
            >
              <Marca className="text-ceu h-5 w-8" />
              <span className="font-display text-lg font-extrabold tracking-tight">14-Bits</span>
            </Link>

            <div className="flex items-center gap-4 text-sm">
              {xpTotal > 0 && (
                <span className="text-latao flex items-center gap-1.5 font-medium">
                  <IconeXp />
                  <span className="font-mono tabular-nums">{xpTotal}</span>
                  <span className="apenas-leitor">pontos de experiência</span>
                </span>
              )}
              {ofensiva > 0 && (
                <span className="text-tinta-fraca hidden font-mono tabular-nums sm:inline">
                  {ofensiva}
                  <span aria-hidden="true"> dia{ofensiva > 1 ? 's' : ''}</span>
                  <span className="apenas-leitor">
                    {' '}
                    dia{ofensiva > 1 ? 's' : ''} seguidos de estudo
                  </span>
                </span>
              )}
              <MenuDaConta />
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

function MenuDaConta() {
  const usuario = useConta((e) => e.usuario)
  const carregando = useConta((e) => e.carregando)
  const sair = useConta((e) => e.sair)
  const [aberto, setAberto] = useState(false)

  if (!temApi) return null

  // Reserva o espaço enquanto descobre se há sessão, para o cabeçalho não pular.
  if (carregando) return <span className="h-9 w-16" aria-hidden="true" />

  if (!usuario) {
    return (
      <Link
        to="/entrar"
        className="min-h-toque border-linha rounded-suave hover:border-ceu hover:text-ceu flex items-center border px-4 font-semibold"
      >
        Entrar
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="min-h-toque border-linha rounded-suave hover:border-ceu flex items-center gap-2 border px-3"
      >
        <span className="bg-ceu grid size-6 place-items-center rounded-full text-xs font-bold text-white">
          {usuario.nome_usuario.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate font-medium sm:inline">
          {usuario.nome_usuario}
        </span>
      </button>

      {aberto && (
        <>
          {/* Clique fora fecha. Um botão invisível em tela cheia resolve sem
              listener global e continua operável por teclado. */}
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
          />
          <div
            role="menu"
            className="border-linha bg-superficie rounded-cartao absolute right-0 z-20 mt-2 w-56 border p-2 shadow-lg"
          >
            <p className="px-3 py-2">
              <span className="block font-semibold">{usuario.nome_usuario}</span>
              <span className="text-tinta-fraca block truncate text-sm">{usuario.email}</span>
            </p>
            <AvisoDeSincronia />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false)
                void sair()
              }}
              className="min-h-toque hover:bg-superficie-alt rounded-suave w-full px-3 text-left font-medium"
            >
              Sair da conta
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function AvisoDeSincronia() {
  const sincronizando = useConta((e) => e.sincronizando)
  const aviso = useConta((e) => e.avisoSincronizacao)

  if (sincronizando) {
    return (
      <p className="text-tinta-fraca border-linha-suave border-t px-3 py-2 text-sm">Salvando…</p>
    )
  }
  if (aviso) {
    return <p className="text-terra border-linha-suave border-t px-3 py-2 text-sm">{aviso}</p>
  }
  return <div className="border-linha-suave my-1 border-t" />
}
