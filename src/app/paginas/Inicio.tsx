import { Link } from 'react-router-dom'
import { trilhas, licoesEmOrdem, proximaPendente, totalGeral, trilhaLiberada } from '@/lib/conteudo'
import { useProgresso } from '@/progresso/store'
import { useConta } from '@/conta/store'
import { temApi } from '@/conta/api'
import { Marca, IconeSeta, IconeCerto, IconeXp } from '@/design/icones'
import type { TrilhaCompleta } from '@conteudo/schema/schema.ts'

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
 * A home serve duas pessoas diferentes.
 *
 * Quem nunca entrou precisa entender em dez segundos o que é isto e começar.
 * Quem já estudou precisa de uma coisa só: o botão para continuar de onde
 * parou, acima de tudo o mais. A página se reorganiza para cada caso em vez de
 * tentar servir aos dois com o mesmo topo.
 */
export function Inicio() {
  const estaConcluida = useProgresso((e) => e.estaConcluida)
  const { feitas, total } = totalGeral(estaConcluida)
  const comecou = feitas > 0

  return (
    <>
      {comecou ? <TopoDeRetorno feitas={feitas} total={total} /> : <TopoDeBoasVindas />}

      <div className="mx-auto max-w-5xl px-5">
        <SecaoTrilhas />
        {!comecou && <SecaoOQueVoceAprende />}
        {!comecou && <SecaoParaQuem />}
        <SecaoSobre />
      </div>

      <Rodape />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Topos                                                                       */
/* -------------------------------------------------------------------------- */

function TopoDeBoasVindas() {
  const usuario = useConta((e) => e.usuario)
  const primeira = trilhas[0] ? licoesEmOrdem(trilhas[0])[0] : undefined

  return (
    <section className="border-linha bg-superficie border-b">
      <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="mb-5 text-4xl leading-[1.05] font-extrabold sm:text-5xl">
              Faça seu primeiro voo
            </h1>

            <p className="text-tinta-suave mb-4 max-w-xl text-lg leading-relaxed">
              Entenda computação — do zero, sem precisar saber programar e sem matemática pesada.
            </p>
            <p className="text-tinta-fraca mb-8 max-w-xl leading-relaxed">
              Em 1906, Santos Dumont voou 60 metros a três de altura no 14-bis. Menos que um
              quarteirão, e mudou o que o mundo achava possível. Ninguém começa atravessando o
              oceano.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {primeira && trilhas[0] && (
                <Link
                  to={`/trilha/${trilhas[0].id}/licao/${primeira.id}`}
                  className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte inline-flex items-center gap-2 px-7 font-semibold text-white transition-colors"
                >
                  Começar a primeira lição
                  <IconeSeta />
                </Link>
              )}
              {temApi && !usuario && (
                <Link
                  to="/entrar"
                  className="min-h-toque border-linha rounded-suave hover:border-ceu inline-flex items-center border px-6 font-semibold"
                >
                  Já tenho conta
                </Link>
              )}
            </div>

            <p className="text-tinta-fraca mt-5 text-sm">
              Não precisa criar conta para estudar. Funciona no celular, inclusive sem internet
              depois da primeira vez.
            </p>
          </div>

          <CartaoDoNome />
        </div>
      </div>
    </section>
  )
}

/** O nome do app, explicado. É a primeira lição do curso em miniatura. */
function CartaoDoNome() {
  const bits = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1]

  return (
    <div className="border-linha rounded-cartao bg-papel border p-7">
      <Marca className="text-ceu mb-5 h-9 w-16" />

      <div className="mb-4 flex flex-wrap gap-1.5" aria-hidden="true">
        {bits.map((ligado, i) => (
          <span
            key={i}
            className={`h-7 w-4 rounded-sm border ${
              ligado ? 'bg-ceu border-ceu' : 'bg-superficie-alt border-linha'
            }`}
          />
        ))}
      </div>

      <p className="text-tinta-suave text-[0.9375rem] leading-relaxed">
        <strong className="text-tinta font-semibold">Quatorze bits</strong> dão 16.384 combinações —
        e toda foto, música e modelo de inteligência artificial é, no fundo, um monte de liga e
        desliga como esses.
      </p>
      <p className="text-tinta-fraca mt-3 text-sm">
        O resto do nome é homenagem ao 14-bis. As duas histórias cabem na primeira lição.
      </p>
    </div>
  )
}

function TopoDeRetorno({ feitas, total }: { feitas: number; total: number }) {
  const estaConcluida = useProgresso((e) => e.estaConcluida)
  const xpTotal = useProgresso((e) => e.xpTotal)
  const ofensiva = useProgresso((e) => e.ofensiva)
  const usuario = useConta((e) => e.usuario)

  const proxima = proximaPendente(estaConcluida)
  const fracao = total > 0 ? feitas / total : 0

  return (
    <section className="border-linha bg-superficie border-b">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">
          {usuario ? `Bom te ver, ${usuario.nome_usuario}` : 'Bom te ver de novo'}
        </h1>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className="text-tinta-suave text-[0.9375rem]">Seu progresso no curso</span>
              <span className="text-tinta-fraca font-mono text-sm tabular-nums">
                {feitas} de {total} lições
              </span>
            </div>
            <div
              className="bg-superficie-alt h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={feitas}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Progresso no curso"
            >
              <div
                className="bg-ceu h-full rounded-full transition-[width] duration-500"
                style={{ width: `${fracao * 100}%` }}
              />
            </div>

            <div className="text-tinta-fraca mt-4 flex flex-wrap gap-5 text-sm">
              <span className="text-latao flex items-center gap-1.5 font-medium">
                <IconeXp />
                <span className="font-mono tabular-nums">{xpTotal}</span> pontos
              </span>
              {ofensiva > 0 && (
                <span>
                  <span className="font-mono tabular-nums">{ofensiva}</span> dia
                  {ofensiva > 1 ? 's' : ''} seguido{ofensiva > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {proxima ? (
            <Link
              to={`/trilha/${proxima.trilha.id}/licao/${proxima.licao.id}`}
              className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte inline-flex items-center justify-center gap-2 px-7 font-semibold text-white transition-colors"
            >
              Continuar
              <IconeSeta />
            </Link>
          ) : (
            <p className="text-mata flex items-center gap-2 font-semibold">
              <IconeCerto />
              Curso concluído
            </p>
          )}
        </div>

        {proxima && (
          <p className="text-tinta-fraca mt-4 text-sm">
            Próxima: <span className="text-tinta-suave">{proxima.licao.titulo}</span> ·{' '}
            {proxima.licao.duracao_min} min
          </p>
        )}

        {temApi && !usuario && (
          <p className="border-linha-suave text-tinta-fraca mt-6 border-t pt-5 text-sm">
            Seu progresso está salvo só neste aparelho.{' '}
            <Link to="/criar-conta" className="text-ceu font-semibold hover:underline">
              Crie uma conta
            </Link>{' '}
            para continuar de outro celular ou do computador da Nave.
          </p>
        )}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Seções                                                                      */
/* -------------------------------------------------------------------------- */

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-linha-suave border-b py-12 last:border-b-0">
      <h2 className="mb-2 text-xl font-bold sm:text-2xl">{titulo}</h2>
      {descricao && <p className="medida text-tinta-suave mb-6">{descricao}</p>}
      <div className={descricao ? '' : 'mt-6'}>{children}</div>
    </section>
  )
}

function SecaoTrilhas() {
  const estaConcluida = useProgresso((e) => e.estaConcluida)

  return (
    <Secao
      titulo="As trilhas"
      descricao="Cada trilha é feita de lições curtas, de cinco a oito minutos. Dá para fazer uma na fila do ônibus."
    >
      {trilhas.length === 0 ? (
        <p className="rounded-cartao border-linha bg-superficie text-tinta-fraca border px-5 py-8 text-center">
          Nenhuma trilha publicada ainda.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {trilhas.map((trilha) => (
            <li key={trilha.id}>
              <CartaoTrilha trilha={trilha} estaConcluida={estaConcluida} />
            </li>
          ))}
        </ul>
      )}
    </Secao>
  )
}

function SecaoOQueVoceAprende() {
  const etapas = [
    {
      numero: '01',
      titulo: 'Como o computador pensa',
      texto:
        'Binário, lógica e algoritmo. Por que a máquina exige precisão e o que é, de fato, um programa.',
    },
    {
      numero: '02',
      titulo: 'Como o computador aprende',
      texto:
        'A virada: em vez de dizer o que fazer, você mostra exemplos. Classificação, regressão, redes neurais e aprendizado por reforço.',
    },
    {
      numero: '03',
      titulo: 'O que ensinamos às máquinas',
      texto:
        'Os dados. Onde achar, como limpar, por que dado ruim vira modelo ruim — e o que a lei diz sobre usar dados de gente.',
    },
  ]

  return (
    <Secao
      titulo="O que você vai aprender"
      descricao="O curso sobe em três degraus, cada um apoiado no anterior."
    >
      <ol className="grid gap-4 sm:grid-cols-3">
        {etapas.map((etapa) => (
          <li key={etapa.numero} className="border-linha rounded-cartao bg-superficie border p-5">
            <span className="text-ceu mb-3 block font-mono text-xs tracking-widest">
              {etapa.numero}
            </span>
            <h3 className="mb-2 font-bold">{etapa.titulo}</h3>
            <p className="text-tinta-suave text-[0.9375rem] leading-relaxed">{etapa.texto}</p>
          </li>
        ))}
      </ol>
    </Secao>
  )
}

function SecaoParaQuem() {
  const perfis = [
    'Está no ensino médio e tem curiosidade por tecnologia',
    'Vai entrar numa graduação da área de computação',
    'Estuda ou trabalha em outra área e quer aplicar IA nela',
    'Só quer entender do que todo mundo está falando',
  ]

  return (
    <Secao titulo="Para quem é">
      <ul className="grid gap-3 sm:grid-cols-2">
        {perfis.map((perfil) => (
          <li key={perfil} className="flex items-start gap-3">
            <IconeCerto className="text-mata mt-1" />
            <span className="text-tinta-suave">{perfil}</span>
          </li>
        ))}
      </ul>
      <p className="text-tinta-fraca mt-6 text-sm">
        Não é exigido nenhum conhecimento prévio de programação ou matemática além do ensino médio.
      </p>
    </Secao>
  )
}

function SecaoSobre() {
  return (
    <Secao titulo="De onde isto vem">
      <div className="medida text-tinta-suave flex flex-col gap-4 leading-relaxed">
        <p>
          O 14-Bits é o material de apoio de um curso presencial ministrado na{' '}
          <strong className="text-tinta font-semibold">Nave do Conhecimento</strong>, dentro do
          programa Jovens Cientistas Cariocas, da Secretaria de Ciência e Tecnologia do Rio em
          parceria com o CIEDS.
        </p>
        <p>
          O curso nasceu do <strong className="text-tinta font-semibold">SALVE</strong>, um sistema
          que usa aprendizado de máquina para antecipar surtos de dengue e outras doenças a partir
          de chuva, temperatura e dados das clínicas da família. Os exemplos do curso vêm de lá —
          não são inventados.
        </p>
        <p>
          A ideia por trás de tudo isso é simples: quem mora na periferia do Rio não precisa só
          consumir tecnologia. Pode construir a que resolve os problemas do próprio território.
        </p>
      </div>
    </Secao>
  )
}

/* -------------------------------------------------------------------------- */

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
  const completa = feitas === licoes.length && licoes.length > 0

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{trilha.titulo}</h3>
          {trilha.subtitulo && (
            <p className="text-tinta-suave mt-1 text-[0.9375rem] leading-relaxed">
              {trilha.subtitulo}
            </p>
          )}
        </div>
        {completa ? (
          <IconeCerto className={`mt-1 shrink-0 ${cor.texto}`} />
        ) : liberada ? (
          <IconeSeta className={`mt-1 shrink-0 ${cor.texto}`} />
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-3">
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
      <div className="rounded-cartao border-linha bg-superficie h-full border px-5 py-5 opacity-55">
        {conteudo}
        <p className="text-tinta-fraca mt-3 text-sm">Conclua a trilha anterior para liberar.</p>
      </div>
    )
  }

  return (
    <Link
      to={`/trilha/${trilha.id}`}
      className="rounded-cartao border-linha bg-superficie hover:border-ceu block h-full border px-5 py-5 transition-colors"
    >
      {conteudo}
    </Link>
  )
}

function Rodape() {
  return (
    <footer className="border-linha bg-superficie mt-4 border-t">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Marca className="text-ceu h-5 w-8" />
              <span className="font-display text-lg font-extrabold tracking-tight">14-Bits</span>
            </div>
            <p className="text-tinta-fraca max-w-xs text-sm leading-relaxed">
              Material de apoio do curso de introdução a Machine Learning da Nave do Conhecimento.
            </p>
          </div>

          <div className="text-tinta-fraca text-sm leading-relaxed">
            <p className="text-tinta-suave mb-1 font-semibold">Realização</p>
            <p>Programa Jovens Cientistas Cariocas</p>
            <p>SMCTI Rio de Janeiro &amp; CIEDS</p>
            <p className="mt-3">Danilo Davi Gomes Fróes — UFRJ</p>
          </div>
        </div>

        <p className="border-linha-suave text-tinta-fraca mt-8 border-t pt-6 text-sm">
          Código sob GPL-3.0 e conteúdo sob CC BY-SA 4.0 — qualquer escola ou Nave pode reusar e
          adaptar este material, citando a fonte.
        </p>
      </div>
    </footer>
  )
}
