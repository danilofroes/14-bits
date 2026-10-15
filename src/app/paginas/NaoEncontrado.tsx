import { Link } from 'react-router-dom'

export function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center">
      <p className="text-tinta-fraca mb-2 font-mono text-sm tracking-widest uppercase">
        Página não encontrada
      </p>
      <h1 className="mb-4 text-3xl font-extrabold">Esse endereço não existe</h1>
      <p className="text-tinta-suave mx-auto mb-8 max-w-md">
        O link pode estar errado ou a lição pode ter mudado de lugar.
      </p>
      <Link
        to="/"
        className="min-h-toque rounded-suave bg-ceu inline-flex items-center px-6 font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
