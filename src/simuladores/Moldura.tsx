/**
 * Moldura comum de todo simulador.
 *
 * Existe para o contrato do PLANEJAMENTO.md §5.5 não depender de cada widget
 * lembrar dele. A moldura garante, de graça:
 *
 *   - botão de reiniciar sempre presente;
 *   - descrição textual para leitor de tela, lida no lugar do gráfico;
 *   - região viva (`aria-live`) onde o widget anuncia o estado atual em
 *     palavras, para quem não enxerga acompanhar o que mudou;
 *   - nunca bloquear o avanço — explorar é opcional.
 *
 * O widget cuida só do próprio desenho.
 */

import type { ReactNode } from 'react'
import { MarcacaoInline } from '@/lib/marcacao'

export function MolduraSimulador({
  instrucao,
  alternativaTexto,
  /** Frase curta que descreve o estado agora. Muda a cada interação. */
  narracao,
  aoReiniciar,
  children,
}: {
  instrucao: string
  alternativaTexto: string
  narracao: string
  aoReiniciar: () => void
  children: ReactNode
}) {
  return (
    <div>
      <p className="medida mb-1 text-[1.0625rem] leading-relaxed font-semibold">
        <MarcacaoInline conteudo={instrucao} />
      </p>

      <div className="rounded-cartao border-linha bg-superficie mt-4 border p-4 sm:p-5">
        {/* O desenho em si é decorativo: quem usa leitor de tela recebe a
            descrição e a narração logo abaixo, em texto. */}
        <div aria-hidden="true">{children}</div>

        <p className="apenas-leitor">{alternativaTexto}</p>
        <p role="status" aria-live="polite" className="apenas-leitor">
          {narracao}
        </p>

        <div className="border-linha-suave mt-4 flex items-center justify-between gap-4 border-t pt-3">
          {/* A mesma narração, visível: serve de legenda para todo mundo. */}
          <p className="text-tinta-fraca min-w-0 text-sm">{narracao}</p>
          <button
            type="button"
            onClick={aoReiniciar}
            className="min-h-toque text-tinta-fraca hover:text-ceu shrink-0 text-sm font-medium"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * Interruptor tocável, usado por mais de um simulador.
 *
 * `rotulo` é o nome acessível (frase inteira, para leitor de tela) e `texto` é
 * o que aparece dentro do botão. Separados porque a frase que o leitor precisa
 * ouvir não cabe — nem faz sentido — impressa num botão.
 */
export function Interruptor({
  ligado,
  rotulo,
  texto,
  aoAlternar,
  tamanho = 'normal',
}: {
  ligado: boolean
  rotulo: string
  texto?: string
  aoAlternar: () => void
  tamanho?: 'normal' | 'pequeno'
}) {
  const pequeno = tamanho === 'pequeno'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={aoAlternar}
      className={`rounded-suave border-2 font-mono font-semibold transition-colors ${
        pequeno ? 'h-11 w-7 text-xs' : 'min-h-toque px-4 text-sm'
      } ${
        ligado
          ? 'border-ceu bg-ceu text-white'
          : 'border-linha bg-superficie-alt text-tinta-fraca hover:border-ceu'
      }`}
    >
      {pequeno ? (ligado ? '1' : '0') : (texto ?? (ligado ? 'V' : 'F'))}
    </button>
  )
}
