/**
 * Rolagem garantida até um elemento.
 *
 * Por que isto existe em vez de um `scrollIntoView` direto: há ambientes em que
 * `behavior: 'smooth'` simplesmente não anima e a página **não rola** — foi
 * flagrado assim no painel de preview, e o mesmo acontece em WebViews e em
 * modos de economia de energia. Como a navegação inteira da lição depende deste
 * scroll (a pessoa aperta "Continuar" e precisa ver o passo novo), não dá para
 * deixar a correção na mão da animação.
 *
 * A estratégia é: tenta suave, e confere depois. Se nada se moveu, vai direto.
 */

/** Tempo até conferir se o scroll suave saiu do lugar. */
const PRAZO_CONFERENCIA = 350

export function rolarAteVisivel(alvo: Element | null): void {
  if (!alvo) return

  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const antes = window.scrollY

  alvo.scrollIntoView({ behavior: suave ? 'smooth' : 'instant', block: 'start' })

  if (!suave) return

  window.setTimeout(() => {
    // Se a animação pegou, scrollY já mudou e não há nada a fazer. Se o alvo
    // já estava visível, reposicionar é inofensivo.
    if (window.scrollY === antes) {
      alvo.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, PRAZO_CONFERENCIA)
}
