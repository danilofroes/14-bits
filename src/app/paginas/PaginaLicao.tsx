import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { acharLicao, acharTrilha, proximaLicao } from '@/lib/conteudo'
import { useProgresso } from '@/progresso/store'
import { Bloco } from '@/blocos'
import {
  acaoDisponivel,
  avancar,
  estadoInicial,
  indiceAtual,
  progresso,
  responder,
  xpGanho,
} from '@/engine/motor'
import type { EstadoLicao } from '@/engine/motor'
import { IconeXp } from '@/design/icones'
import { NaoEncontrado } from './NaoEncontrado'

export function PaginaLicao() {
  const { idTrilha, idLicao } = useParams()
  const trilha = acharTrilha(idTrilha)
  const licao = acharLicao(trilha, idLicao)

  if (!trilha || !licao) return <NaoEncontrado />

  // A chave remonta o componente ao trocar de lição, zerando o estado sem
  // precisar de um efeito de limpeza.
  return <Executor key={`${trilha.id}/${licao.id}`} idTrilha={trilha.id} idLicao={licao.id} />
}

function Executor({ idTrilha, idLicao }: { idTrilha: string; idLicao: string }) {
  const navegar = useNavigate()
  const trilha = acharTrilha(idTrilha)!
  const licao = acharLicao(trilha, idLicao)!

  const [estado, setEstado] = useState<EstadoLicao>(estadoInicial)
  const [selecao, setSelecao] = useState<number[]>([])
  const fimDaLista = useRef<HTMLDivElement>(null)

  const i = indiceAtual(estado)
  const acao = acaoDisponivel(licao, estado, selecao)
  const concluirLicao = useProgresso((e) => e.concluirLicao)

  // Rola até o passo recém-revelado. Sem isso, em telas pequenas, a pessoa
  // aperta "Continuar" e não vê nada acontecer.
  useEffect(() => {
    if (estado.revelados > 1) {
      fimDaLista.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [estado.revelados])

  function aoAgir() {
    if (acao.tipo === 'verificar') {
      setEstado((atual) => responder(licao, atual, i, selecao))
      return
    }

    if (acao.tipo === 'concluir') {
      concluirLicao(idTrilha, idLicao, xpGanho(licao, estado))
      setEstado((atual) => ({ ...atual, concluida: true }))
      return
    }

    setSelecao([])
    setEstado((atual) => avancar(licao, atual))
  }

  if (estado.concluida) {
    return <Conclusao idTrilha={idTrilha} idLicao={idLicao} xp={xpGanho(licao, estado)} />
  }

  const passos = licao.passos.slice(0, estado.revelados)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-linha bg-superficie/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-3">
          <button
            type="button"
            onClick={() => navegar(`/trilha/${idTrilha}`)}
            className="min-h-toque text-tinta-fraca hover:text-ceu shrink-0 text-sm"
          >
            ← Sair
          </button>

          <div
            className="bg-superficie-alt h-1.5 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={estado.revelados}
            aria-valuemin={0}
            aria-valuemax={licao.passos.length}
            aria-label="Progresso da lição"
          >
            <div
              className="bg-ceu h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progresso(licao, estado) * 100}%` }}
            />
          </div>

          <span className="text-tinta-fraca shrink-0 font-mono text-xs tabular-nums">
            {estado.revelados}/{licao.passos.length}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <h1 className="mb-8 text-2xl font-extrabold">{licao.titulo}</h1>

        <div className="flex flex-col gap-8">
          {passos.map((passo, indice) => (
            <div
              key={passo.id ?? indice}
              className={indice < i ? 'opacity-70 transition-opacity' : ''}
            >
              <Bloco
                passo={passo}
                indice={indice}
                resposta={estado.respostas[indice]}
                selecao={indice === i ? selecao : (estado.respostas[indice]?.escolhas ?? [])}
                aoSelecionar={setSelecao}
                ativo={indice === i}
              />
            </div>
          ))}
        </div>

        <div ref={fimDaLista} className="h-4" />
      </div>

      <footer className="border-linha bg-superficie/95 sticky bottom-0 border-t backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <button
            type="button"
            onClick={aoAgir}
            disabled={acao.tipo === 'verificar' && !acao.habilitada}
            className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte disabled:bg-superficie-alt disabled:text-tinta-fraca w-full px-6 font-semibold text-white transition-colors disabled:cursor-not-allowed"
          >
            {acao.tipo === 'verificar' && 'Verificar'}
            {acao.tipo === 'continuar' && 'Continuar'}
            {acao.tipo === 'concluir' && 'Concluir lição'}
          </button>
        </div>
      </footer>
    </div>
  )
}

function Conclusao({ idTrilha, idLicao, xp }: { idTrilha: string; idLicao: string; xp: number }) {
  const trilha = acharTrilha(idTrilha)!
  const proxima = proximaLicao(trilha, idLicao)

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-tinta-fraca mb-3 font-mono text-sm tracking-widest uppercase">
        Lição concluída
      </p>
      <h1 className="mb-4 text-3xl font-extrabold">Mais um trecho voado</h1>

      <p className="text-latao mb-10 flex items-center gap-2 text-xl font-semibold">
        <IconeXp />
        <span className="font-mono tabular-nums">+{xp}</span>
        <span className="text-tinta-suave text-base font-normal">pontos</span>
      </p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {proxima ? (
          <Link
            to={`/trilha/${trilha.id}/licao/${proxima.id}`}
            className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte flex items-center justify-center px-6 font-semibold text-white"
          >
            Próxima lição
          </Link>
        ) : (
          <p className="text-tinta-suave mb-2">
            Você terminou a trilha <strong className="font-semibold">{trilha.titulo}</strong>.
          </p>
        )}

        <Link
          to={`/trilha/${trilha.id}`}
          className="min-h-toque rounded-suave border-linha text-tinta hover:border-ceu flex items-center justify-center border px-6 font-semibold"
        >
          Voltar para a trilha
        </Link>
      </div>
    </div>
  )
}
