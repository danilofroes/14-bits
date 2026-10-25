import { describe, expect, it } from 'vitest'
import { PROGRAMAS } from './tracos'

const maior = PROGRAMAS['maior-de-uma-lista']

describe('maior-de-uma-lista', () => {
  it('acha o maior número', () => {
    expect(maior([23, 31, 27, 35, 29]).resultado).toBe('35')
  })

  it('funciona quando o maior é o primeiro', () => {
    expect(maior([99, 2, 3]).resultado).toBe('99')
  })

  it('funciona quando o maior é o último', () => {
    expect(maior([2, 3, 99]).resultado).toBe('99')
  })

  it('funciona com números negativos', () => {
    // Este é o caso que a lição usa para justificar o primeiro passo: começar
    // de zero daria a resposta errada numa semana inteira de temperaturas
    // negativas.
    expect(maior([-8, -3, -15]).resultado).toBe('-3')
  })

  it('aguenta números repetidos sem se perder', () => {
    expect(maior([7, 7, 7]).resultado).toBe('7')
  })

  it('o primeiro quadro assume o primeiro número como maior', () => {
    const traco = maior([23, 31])
    expect(traco.quadros[0]?.variaveis.maior).toBe('23')
    expect(traco.quadros[0]?.olhando).toBe(0)
  })

  it('o último quadro bate com o resultado', () => {
    const traco = maior([4, 9, 1])
    const ultimo = traco.quadros[traco.quadros.length - 1]
    expect(ultimo?.variaveis.maior).toBe(traco.resultado)
  })

  it('gera dois quadros por número depois do primeiro, mais o início e o fim', () => {
    const traco = maior([1, 2, 3, 4])
    expect(traco.quadros).toHaveLength(1 + 3 * 2 + 1)
  })

  it('toda linha citada existe no pseudocódigo', () => {
    const traco = maior([5, 1, 8])
    for (const quadro of traco.quadros) {
      expect(quadro.linha).toBeGreaterThanOrEqual(0)
      expect(quadro.linha).toBeLessThan(traco.linhas.length)
    }
  })

  it('toda posição olhada existe na lista', () => {
    const dados = [5, 1, 8]
    for (const quadro of maior(dados).quadros) {
      if (quadro.olhando === undefined) continue
      expect(quadro.olhando).toBeGreaterThanOrEqual(0)
      expect(quadro.olhando).toBeLessThan(dados.length)
    }
  })

  it('todo quadro explica o que aconteceu', () => {
    // A nota é metade do valor didático: sem ela o simulador vira animação.
    for (const quadro of maior([3, 6, 2]).quadros) {
      expect(quadro.nota.length).toBeGreaterThan(15)
    }
  })

  it('`maior` nunca diminui ao longo da execução', () => {
    const valores = maior([10, 4, 22, 7, 30]).quadros.map((q) => Number(q.variaveis.maior))
    for (let i = 1; i < valores.length; i++) {
      expect(valores[i]!).toBeGreaterThanOrEqual(valores[i - 1]!)
    }
  })
})
