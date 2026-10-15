import { describe, expect, it } from 'vitest'
import { diasEntre, hoje, proximaOfensiva } from './store'

describe('hoje', () => {
  it('usa horário local, não UTC', () => {
    // 23h59 no fuso do Rio ainda é o mesmo dia, mesmo já sendo o dia seguinte
    // em Greenwich. Se isto quebrar, a ofensiva vira à meia-noite errada.
    const fimDaNoite = new Date(2026, 9, 26, 23, 59)
    expect(hoje(fimDaNoite)).toBe('2026-10-26')
  })

  it('preenche mês e dia com zero à esquerda', () => {
    expect(hoje(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('diasEntre', () => {
  it('conta dias inteiros', () => {
    expect(diasEntre('2026-10-26', '2026-10-27')).toBe(1)
    expect(diasEntre('2026-10-26', '2026-10-26')).toBe(0)
    expect(diasEntre('2026-10-26', '2026-11-02')).toBe(7)
  })

  it('atravessa a virada do ano', () => {
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1)
  })
})

describe('proximaOfensiva', () => {
  it('começa em 1 na primeira lição da vida', () => {
    expect(proximaOfensiva(0, null, '2026-10-26')).toBe(1)
  })

  it('não sobe duas vezes no mesmo dia', () => {
    expect(proximaOfensiva(3, '2026-10-26', '2026-10-26')).toBe(3)
  })

  it('soma no dia seguinte', () => {
    expect(proximaOfensiva(3, '2026-10-26', '2026-10-27')).toBe(4)
  })

  it('recomeça depois de pular um dia', () => {
    expect(proximaOfensiva(9, '2026-10-26', '2026-10-28')).toBe(1)
  })

  it('não deixa a ofensiva em zero quando já houve estudo hoje', () => {
    expect(proximaOfensiva(0, '2026-10-26', '2026-10-26')).toBe(1)
  })
})
