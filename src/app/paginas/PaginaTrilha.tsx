import { Link, useParams } from 'react-router-dom'
import { acharTrilha } from '@/lib/conteudo'
import { useProgresso } from '@/progresso/store'
import { IconeCerto, IconeSeta } from '@/design/icones'
import { NaoEncontrado } from './NaoEncontrado'

export function PaginaTrilha() {
  const { idTrilha } = useParams()
  const trilha = acharTrilha(idTrilha)
  const estaConcluida = useProgresso((e) => e.estaConcluida)

  if (!trilha) return <NaoEncontrado />

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Link
        to="/"
        className="text-tinta-fraca hover:text-ceu mb-6 inline-block text-sm hover:underline"
      >
        ← Todas as trilhas
      </Link>

      <h1 className="mb-2 text-3xl font-extrabold">{trilha.titulo}</h1>
      {trilha.subtitulo && <p className="medida text-tinta-suave text-lg">{trilha.subtitulo}</p>}

      <div className="mt-8 flex flex-col gap-8">
        {trilha.modulos.map((modulo) => (
          <section key={modulo.id}>
            <h2 className="text-tinta-fraca mb-3 font-mono text-xs tracking-widest uppercase">
              {modulo.titulo}
            </h2>

            <ul className="flex flex-col gap-2">
              {modulo.licoes.map((idLicao) => {
                const licao = trilha.licoes[idLicao]
                if (!licao) return null
                const feita = estaConcluida(trilha.id, licao.id)

                return (
                  <li key={licao.id}>
                    <Link
                      to={`/trilha/${trilha.id}/licao/${licao.id}`}
                      className="min-h-toque rounded-cartao border-linha bg-superficie hover:border-ceu flex items-center gap-3 border px-4 py-3 transition-colors"
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                          feita
                            ? 'border-mata bg-mata-claro text-mata'
                            : 'border-linha text-tinta-fraca'
                        }`}
                      >
                        {feita ? <IconeCerto /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{licao.titulo}</span>
                        <span className="text-tinta-fraca block text-sm">
                          {licao.duracao_min} min
                          {feita && (
                            <>
                              {' · '}
                              <span className="text-mata">concluída</span>
                            </>
                          )}
                        </span>
                      </span>

                      <IconeSeta className="text-tinta-fraca shrink-0" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
