import type { PassoTexto } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { Marcacao } from '@/lib/marcacao'

export function BlocoTexto({ passo }: PropsBloco<PassoTexto>) {
  return (
    <div className="text-[1.0625rem] leading-relaxed">
      <Marcacao conteudo={passo.conteudo} />
    </div>
  )
}
