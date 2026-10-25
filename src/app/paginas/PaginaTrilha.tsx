import { Link, useParams } from 'react-router-dom'
import { acharTrilha, licoesEmOrdem } from '@/lib/conteudo'
import { useProgresso } from '@/progresso/store'
import { IconeCerto, IconeSeta, IconeXp } from '@/design/icones'
import { NaoEncontrado } from './NaoEncontrado'
import type { Licao, TrilhaCompleta } from '@conteudo/schema/schema.ts'

const CORES = {
  ceu: { texto: 'text-ceu', fundo: 'bg-ceu', claro: 'bg-ceu-claro', borda: 'border-ceu' },
  latao: {
    texto: 'text-latao',
    fundo: 'bg-latao',
    claro: 'bg-latao-claro',
    borda: 'border-latao',
  },
  mata: { texto: 'text-mata', fundo: 'bg-mata', claro: 'bg-mata-claro', borda: 'border-mata' },
  terra: {
    texto: 'text-terra',
    fundo: 'bg-terra',
    claro: 'bg-terra-claro',
    borda: 'border-terra',
  },
} as const

/**
 * A trilha como um caminho, não como uma lista.
 *
 * A versão anterior era uma pilha de linhas de texto, e dava para ler a trilha
 * inteira sem nunca saber onde se estava. Aqui cada lição é um nó numerado
 * ligado por uma linha contínua: a posição no caminho aparece antes de
 * qualquer leitura, e a próxima lição é a única em destaque.
 */
export function PaginaTrilha() {
  const { idTrilha } = useParams()
  const trilha = acharTrilha(idTrilha)
  const estaConcluida = useProgresso((e) => e.estaConcluida)

  if (!trilha) return <NaoEncontrado />

  const licoes = licoesEmOrdem(trilha)
  const feitas = licoes.filter((l) => estaConcluida(trilha.id, l.id)).length
  const cor = CORES[trilha.cor]

  // Primeira pendente: é a única que recebe destaque de "faça esta agora".
  const proxima = licoes.find((l) => !estaConcluida(trilha.id, l.id))

  // Achata módulos e lições numa sequência só, com a numeração correndo ao
  // longo da trilha inteira.
  type Item =
    | { tipo: 'modulo'; id: string; titulo: string; concluido: boolean }
    | { tipo: 'licao'; licao: Licao; numero: number; ultima: boolean }

  const itens: Item[] = []
  let contador = 0
  for (const modulo of trilha.modulos) {
    const doModulo = modulo.licoes
      .map((id) => trilha.licoes[id])
      .filter((l): l is Licao => Boolean(l))

    itens.push({
      tipo: 'modulo',
      id: modulo.id,
      titulo: modulo.titulo,
      // O marco só acende quando tudo antes dele foi feito.
      concluido: itens.every((i) => i.tipo !== 'licao' || estaConcluida(trilha.id, i.licao.id)),
    })

    for (const licao of doModulo) {
      contador++
      itens.push({ tipo: 'licao', licao, numero: contador, ultima: false })
    }
  }
  const ultimoItem = itens[itens.length - 1]
  if (ultimoItem?.tipo === 'licao') ultimoItem.ultima = true

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link
        to="/"
        className="text-tinta-fraca hover:text-ceu min-h-toque mb-4 inline-flex items-center text-sm"
      >
        ← Todas as trilhas
      </Link>

      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-extrabold">{trilha.titulo}</h1>
        {trilha.subtitulo && (
          <p className="medida text-tinta-suave text-lg leading-relaxed">{trilha.subtitulo}</p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div
            className={`h-2 flex-1 overflow-hidden rounded-full ${cor.claro}`}
            role="progressbar"
            aria-valuenow={feitas}
            aria-valuemin={0}
            aria-valuemax={licoes.length}
            aria-label={`Progresso em ${trilha.titulo}`}
          >
            <div
              className={`h-full rounded-full ${cor.fundo} transition-[width] duration-500`}
              style={{ width: `${licoes.length ? (feitas / licoes.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-tinta-fraca shrink-0 font-mono text-sm tabular-nums">
            {feitas}/{licoes.length}
          </span>
        </div>
      </header>

      {/* Uma lista só para a trilha inteira: o caminho precisa ser contínuo, e
          os títulos de módulo são marcos ao longo dele, não cortes. */}
      <ol className="flex flex-col">
        {itens.map((item) =>
          item.tipo === 'modulo' ? (
            <li key={`modulo-${item.id}`} className="relative flex gap-4">
              <LinhaDoCaminho concluida={item.concluido} />
              <span
                aria-hidden="true"
                className={`relative z-10 mt-3 size-3 shrink-0 translate-x-4 rounded-full ${
                  item.concluido ? cor.fundo : 'bg-linha'
                }`}
              />
              <h2 className="text-tinta-fraca mt-1.5 mb-3 ml-1 font-mono text-xs tracking-widest uppercase">
                {item.titulo}
              </h2>
            </li>
          ) : (
            <No
              key={item.licao.id}
              trilha={trilha}
              licao={item.licao}
              numero={item.numero}
              feita={estaConcluida(trilha.id, item.licao.id)}
              destacada={proxima?.id === item.licao.id}
              ultima={item.ultima}
            />
          ),
        )}
      </ol>
    </div>
  )
}

/**
 * Um nó do caminho.
 *
 * O estado chega por três canais ao mesmo tempo — número ou tique, cor, e a
 * palavra escrita ("concluída", "comece por aqui") — porque depender só de cor
 * deixaria a trilha ilegível para quem não a distingue.
 */
function No({
  trilha,
  licao,
  numero,
  feita,
  destacada,
  ultima,
}: {
  trilha: TrilhaCompleta
  licao: Licao
  numero: number
  feita: boolean
  destacada: boolean
  ultima: boolean
}) {
  const cor = CORES[trilha.cor]

  return (
    <li className="relative flex gap-4">
      {!ultima && <LinhaDoCaminho concluida={feita} cor={cor.fundo} />}

      <span
        aria-hidden="true"
        className={`relative z-10 mt-1 grid size-11 shrink-0 place-items-center rounded-full border-2 font-mono text-sm font-bold ${
          feita
            ? `${cor.borda} ${cor.fundo} text-white`
            : destacada
              ? `${cor.borda} ${cor.claro} ${cor.texto}`
              : 'border-linha bg-superficie text-tinta-fraca'
        }`}
      >
        {feita ? <IconeCerto className="size-5" /> : numero}
      </span>

      <Link
        to={`/trilha/${trilha.id}/licao/${licao.id}`}
        className={`rounded-cartao mb-3 block min-w-0 flex-1 border px-4 py-3 transition-colors ${
          destacada
            ? `${cor.borda} bg-superficie shadow-sm`
            : 'border-linha bg-superficie hover:border-ceu'
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block font-semibold">{licao.titulo}</span>
            <span className="text-tinta-fraca mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
              <span>{licao.duracao_min} min</span>
              <span aria-hidden="true">·</span>
              <span className="text-latao inline-flex items-center gap-1">
                <IconeXp className="size-3.5" />
                <span className="font-mono tabular-nums">{licao.xp}</span>
              </span>
              {feita && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={cor.texto}>concluída</span>
                </>
              )}
              {destacada && !feita && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className={`font-semibold ${cor.texto}`}>comece por aqui</span>
                </>
              )}
            </span>
          </span>
          <IconeSeta className="text-tinta-fraca mt-1 shrink-0" />
        </span>
      </Link>
    </li>
  )
}

/**
 * O traço vertical que liga um ponto do caminho ao seguinte.
 *
 * Vai de cima a baixo do item e fica atrás do nó (z menor), então o círculo
 * cobre a parte que passaria por dentro dele.
 */
function LinhaDoCaminho({ concluida, cor = 'bg-ceu' }: { concluida: boolean; cor?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 bottom-0 left-[1.3125rem] w-0.5 ${concluida ? cor : 'bg-linha'}`}
    />
  )
}
