import type { PassoDestaque } from '@conteudo/schema/schema.ts'
import type { PropsBloco } from './tipos'
import { Marcacao } from '@/lib/marcacao'

/** Cada estilo carrega rótulo escrito, não só cor — §6.2. */
const ESTILOS = {
  dica: {
    rotulo: 'Dica',
    borda: 'border-l-ceu',
    fundo: 'bg-ceu-claro',
    texto: 'text-ceu',
  },
  atencao: {
    rotulo: 'Atenção',
    borda: 'border-l-terra',
    fundo: 'bg-terra-claro',
    texto: 'text-terra',
  },
  curiosidade: {
    rotulo: 'Curiosidade',
    borda: 'border-l-latao',
    fundo: 'bg-latao-claro',
    texto: 'text-latao',
  },
} as const

export function BlocoDestaque({ passo }: PropsBloco<PassoDestaque>) {
  const estilo = ESTILOS[passo.estilo]

  return (
    <aside className={`medida border-l-3 ${estilo.borda} ${estilo.fundo} px-5 py-4`}>
      <p className={`mb-1.5 font-mono text-[0.6875rem] tracking-widest uppercase ${estilo.texto}`}>
        {estilo.rotulo}
      </p>
      <div className="text-[1.0625rem] leading-relaxed">
        <Marcacao conteudo={passo.conteudo} />
      </div>
    </aside>
  )
}
