import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useConta } from '@/conta/store'
import { ErroDaApi, temApi } from '@/conta/api'
import { Marca } from '@/design/icones'

type Modo = 'entrar' | 'criar'

/**
 * Entrar e criar conta, na mesma tela.
 *
 * Duas coisas que esta tela sustenta o tempo todo: a conta é **opcional** (há
 * sempre uma saída para continuar sem ela) e nada aqui é obrigatório para
 * aprender. Quem chegou pelo QR code na Nave pode fechar e seguir estudando.
 */
export function PaginaConta({ modo }: { modo: Modo }) {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const destino = parametros.get('voltar') || '/'

  const criarConta = useConta((e) => e.criarConta)
  const entrar = useConta((e) => e.entrar)

  const [identificador, setIdentificador] = useState('')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<{ mensagem: string; campo?: string } | null>(null)

  const criando = modo === 'criar'

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) return

    setEnviando(true)
    setErro(null)
    try {
      if (criando) {
        await criarConta({ nome_usuario: nomeUsuario, email, senha })
      } else {
        await entrar({ identificador, senha })
      }
      navegar(destino, { replace: true })
    } catch (e) {
      const daApi = e instanceof ErroDaApi
      setErro({
        mensagem: daApi ? e.message : 'Algo deu errado. Tente de novo.',
        ...(daApi && e.campo ? { campo: e.campo } : {}),
      })
      setEnviando(false)
    }
  }

  if (!temApi) {
    return (
      <Moldura>
        <h1 className="mb-3 text-2xl font-extrabold">Contas ainda não estão ligadas</h1>
        <p className="text-tinta-suave mb-8">
          Este app está rodando sem servidor de contas. Seu progresso continua salvo neste aparelho,
          normalmente.
        </p>
        <Link
          to="/"
          className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte inline-flex items-center px-6 font-semibold text-white"
        >
          Voltar ao início
        </Link>
      </Moldura>
    )
  }

  return (
    <Moldura>
      <h1 className="mb-2 text-3xl font-extrabold">
        {criando ? 'Criar sua conta' : 'Entrar na sua conta'}
      </h1>
      <p className="text-tinta-suave mb-8">
        {criando
          ? 'A conta serve para levar seu progresso de um aparelho para outro. Dá para estudar sem ela.'
          : 'Que bom te ver de volta.'}
      </p>

      <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
        {criando ? (
          <>
            <Campo
              id="nome_usuario"
              rotulo="Nome de usuário"
              valor={nomeUsuario}
              aoMudar={setNomeUsuario}
              autoComplete="username"
              dica="Letras, números, ponto, hífen e underline."
              erro={erro?.campo === 'nome_usuario' ? erro.mensagem : undefined}
            />
            <Campo
              id="email"
              rotulo="E-mail"
              tipo="email"
              valor={email}
              aoMudar={setEmail}
              autoComplete="email"
              erro={erro?.campo === 'email' ? erro.mensagem : undefined}
            />
          </>
        ) : (
          <Campo
            id="identificador"
            rotulo="E-mail ou nome de usuário"
            valor={identificador}
            aoMudar={setIdentificador}
            autoComplete="username"
            erro={erro?.campo === 'identificador' ? erro.mensagem : undefined}
          />
        )}

        <Campo
          id="senha"
          rotulo="Senha"
          tipo={mostrarSenha ? 'text' : 'password'}
          valor={senha}
          aoMudar={setSenha}
          autoComplete={criando ? 'new-password' : 'current-password'}
          dica={criando ? 'Pelo menos 8 caracteres.' : undefined}
          erro={erro?.campo === 'senha' ? erro.mensagem : undefined}
          acessorio={
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="text-ceu min-h-toque px-1 text-sm font-medium"
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          }
        />

        {erro && !erro.campo && (
          <p role="alert" className="border-l-terra bg-terra-claro text-terra border-l-3 px-4 py-3">
            {erro.mensagem}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-toque rounded-suave bg-ceu hover:bg-ceu-forte disabled:bg-superficie-alt disabled:text-tinta-fraca mt-2 w-full px-6 font-semibold text-white transition-colors disabled:cursor-not-allowed"
        >
          {enviando ? 'Um instante…' : criando ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <div className="border-linha mt-8 border-t pt-6">
        <p className="text-tinta-suave text-[0.9375rem]">
          {criando ? 'Já tem conta? ' : 'Ainda não tem conta? '}
          <Link
            to={criando ? '/entrar' : '/criar-conta'}
            className="text-ceu font-semibold hover:underline"
          >
            {criando ? 'Entrar' : 'Criar uma agora'}
          </Link>
        </p>
        <p className="mt-3">
          <Link to="/" className="text-tinta-fraca text-[0.9375rem] hover:underline">
            Continuar sem conta →
          </Link>
        </p>
      </div>

      {criando && (
        <p className="text-tinta-fraca mt-8 text-sm leading-relaxed">
          Guardamos apenas seu nome de usuário, e-mail e quais lições você concluiu. Suas respostas
          às perguntas abertas ficam só neste aparelho e nunca são enviadas.
        </p>
      )}
    </Moldura>
  )
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Link to="/" className="text-ceu mb-8 inline-block" aria-label="14-Bits, página inicial">
        <Marca className="h-7 w-12" />
      </Link>
      {children}
    </div>
  )
}

function Campo({
  id,
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  autoComplete,
  dica,
  erro,
  acessorio,
}: {
  id: string
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  tipo?: string
  autoComplete?: string
  dica?: string
  erro?: string
  acessorio?: React.ReactNode
}) {
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-semibold">
          {rotulo}
        </label>
        {acessorio}
      </div>

      <input
        id={id}
        name={id}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idErro, idDica].filter(Boolean).join(' ') || undefined}
        className={`min-h-toque rounded-suave bg-superficie focus:border-ceu w-full border px-3.5 py-2.5 ${
          erro ? 'border-terra' : 'border-linha'
        }`}
      />

      {erro && (
        <p id={idErro} role="alert" className="text-terra mt-1.5 text-sm">
          {erro}
        </p>
      )}
      {dica && !erro && (
        <p id={idDica} className="text-tinta-fraca mt-1.5 text-sm">
          {dica}
        </p>
      )}
    </div>
  )
}
