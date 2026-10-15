import { Link } from 'react-router-dom'
import { trilhas, licoesEmOrdem, trilhaLiberada } from '@/lib/conteudo'
import { useProgresso } from '@/progresso/store'
import { Marca, IconeSeta } from '@/design/icones'
import type { TrilhaCompleta } from '@conteudo/schema/schema.ts'

const CORES = {
  ceu: { texto: 'text-ceu', fundo: 'bg-ceu', claro: 'bg-ceu-claro' },
  latao: { texto: 'text-latao', fundo: 'bg-latao', claro: 'bg-latao-claro' },
  mata: { texto: 'text-mata', fundo: 'bg-mata', claro: 'bg-mata-claro' },
  terra: { texto: 'text-terra', fundo: 'bg-terra', claro: 'bg-terra-claro' },
} as const

export function Inicio() {
  const estaConcluida = useProgresso((e) => e.estaConcluida)

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <section className="mb-10">
        <Marca className="text-ceu mb-5 h-8 w-14" />
        <h1 className="mb-3 text-4xl font-extrabold">Faça seu primeiro voo</h1>
        <p className="medida text-tinta-suave text-lg">
          Em 1906, Santos Dumont voou 60 metros a 3 de altura no 14-bis, e o mundo mudou de ideia
          sobre o que era possível. Aqui você vai entender como as máquinas aprendem — começando do
          zero, sem precisar saber programar.
        </p>
      </section>

      {trilhas.length === 0 ? (
        <p className="rounded-cartao border-linha bg-superficie text-tinta-fraca border px-5 py-8 text-center">
          Nenhuma trilha publicada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {trilhas.map((trilha) => (
            <li key={trilha.id}>
              <CartaoTrilha trilha={trilha} estaConcluida={estaConcluida} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CartaoTrilha({
  trilha,
  estaConcluida,
}: {
  trilha: TrilhaCompleta
  estaConcluida: (idTrilha: string, idLicao: string) => boolean
}) {
  const licoes = licoesEmOrdem(trilha)
  const feitas = licoes.filter((l) => estaConcluida(trilha.id, l.id)).length
  const liberada = trilhaLiberada(trilha, estaConcluida)
  const cor = CORES[trilha.cor]
  const fracao = licoes.length > 0 ? feitas / licoes.length : 0

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{trilha.titulo}</h2>
          {trilha.subtitulo && (
            <p className="text-tinta-suave mt-1 text-[0.9375rem]">{trilha.subtitulo}</p>
          )}
        </div>
        {liberada && <IconeSeta className={`mt-1 ${cor.texto}`} />}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className={`h-1.5 flex-1 overflow-hidden rounded-full ${cor.claro}`}
          role="progressbar"
          aria-valuenow={feitas}
          aria-valuemin={0}
          aria-valuemax={licoes.length}
          aria-label={`Progresso em ${trilha.titulo}`}
        >
          <div
            className={`h-full rounded-full ${cor.fundo} transition-[width] duration-500`}
            style={{ width: `${fracao * 100}%` }}
          />
        </div>
        <span className="text-tinta-fraca shrink-0 font-mono text-xs tabular-nums">
          {feitas}/{licoes.length}
        </span>
      </div>
    </>
  )

  if (!liberada) {
    return (
      <div className="rounded-cartao border-linha bg-superficie border px-5 py-4 opacity-55">
        {conteudo}
        <p className="text-tinta-fraca mt-3 text-sm">
          Conclua a trilha anterior para liberar esta.
        </p>
      </div>
    )
  }

  return (
    <Link
      to={`/trilha/${trilha.id}`}
      className="rounded-cartao border-linha bg-superficie hover:border-ceu block border px-5 py-4 transition-colors"
    >
      {conteudo}
    </Link>
  )
}
