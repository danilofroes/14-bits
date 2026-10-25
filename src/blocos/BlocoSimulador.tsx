import type { PassoSimulador } from '@conteudo/schema/schema.ts'
import { PARAMETROS_POR_WIDGET } from '@conteudo/schema/simuladores.ts'
import type { IdWidget } from '@conteudo/schema/simuladores.ts'
import type { PropsBloco } from './tipos'
import { WIDGETS } from '@/simuladores'
import { Marcacao } from '@/lib/marcacao'

/**
 * Ponte entre o conteúdo e o widget.
 *
 * Os parâmetros passam pelo mesmo Zod que o validador usa, então o widget
 * recebe valores já com os padrões aplicados e não precisa se defender de
 * conteúdo malformado.
 */
export function BlocoSimulador({ passo }: PropsBloco<PassoSimulador>) {
  const id = passo.widget as IdWidget
  const Widget = WIDGETS[id]
  const esquema = PARAMETROS_POR_WIDGET[id]

  if (!Widget || !esquema) {
    return (
      <p className="border-l-terra bg-terra-claro text-terra border-l-3 px-4 py-3">
        Simulador sem componente: <code className="font-mono">{passo.widget}</code>
      </p>
    )
  }

  const analise = esquema.safeParse(passo.parametros)
  if (!analise.success) {
    return (
      <p className="border-l-terra bg-terra-claro text-terra border-l-3 px-4 py-3">
        Parâmetros inválidos para <code className="font-mono">{passo.widget}</code>.
      </p>
    )
  }

  return (
    <div>
      <Widget
        parametros={analise.data}
        instrucao={passo.instrucao}
        alternativaTexto={passo.alternativa_texto}
      />

      {passo.pergunta_apos && (
        <div className="medida mt-4 text-[0.9375rem]">
          <Marcacao conteudo={passo.pergunta_apos} />
        </div>
      )}
    </div>
  )
}
