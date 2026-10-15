import { describe, expect, it } from 'vitest'
import type { Licao } from '@conteudo/schema/schema.ts'
import {
  acaoDisponivel,
  avancar,
  corrigirQuiz,
  estadoInicial,
  progresso,
  responder,
  xpGanho,
} from './motor'

/** Lição mínima: texto, quiz de resposta única, quiz de resposta múltipla. */
function licaoDeTeste(): Licao {
  return {
    id: 'teste',
    titulo: 'Lição de teste',
    objetivo: 'testar o motor',
    duracao_min: 5,
    xp: 20,
    conceitos: [],
    passos: [
      { tipo: 'texto', conteudo: 'olá', opcional: false, conceitos: [] },
      {
        tipo: 'quiz',
        pergunta: 'quanto é 2 bits?',
        embaralhar: false,
        opcional: false,
        conceitos: [],
        alternativas: [
          { texto: '4', correta: true },
          { texto: '2', correta: false },
        ],
      },
      {
        tipo: 'quiz',
        pergunta: 'quais são pares?',
        embaralhar: false,
        opcional: false,
        conceitos: [],
        alternativas: [
          { texto: '2', correta: true },
          { texto: '3', correta: false },
          { texto: '4', correta: true },
        ],
      },
    ],
  } as Licao
}

describe('corrigirQuiz', () => {
  const licao = licaoDeTeste()
  const unica = licao.passos[1] as never
  const multipla = licao.passos[2] as never

  it('aceita a alternativa correta', () => {
    expect(corrigirQuiz(unica, [0])).toBe(true)
  })

  it('rejeita a alternativa errada', () => {
    expect(corrigirQuiz(unica, [1])).toBe(false)
  })

  it('exige todas as corretas quando há mais de uma', () => {
    expect(corrigirQuiz(multipla, [0, 2])).toBe(true)
    expect(corrigirQuiz(multipla, [0])).toBe(false)
  })

  it('rejeita quando sobra uma alternativa errada junto das certas', () => {
    expect(corrigirQuiz(multipla, [0, 1, 2])).toBe(false)
  })

  it('rejeita seleção vazia', () => {
    expect(corrigirQuiz(unica, [])).toBe(false)
  })
})

describe('acaoDisponivel', () => {
  const licao = licaoDeTeste()

  it('num passo de texto, oferece continuar', () => {
    expect(acaoDisponivel(licao, estadoInicial(), [])).toEqual({ tipo: 'continuar' })
  })

  it('num quiz sem resposta, pede verificar e trava sem seleção', () => {
    const estado = avancar(licao, estadoInicial())
    expect(acaoDisponivel(licao, estado, [])).toEqual({ tipo: 'verificar', habilitada: false })
    expect(acaoDisponivel(licao, estado, [0])).toEqual({ tipo: 'verificar', habilitada: true })
  })

  it('num quiz já respondido, libera continuar', () => {
    let estado = avancar(licao, estadoInicial())
    estado = responder(licao, estado, 1, [1])
    expect(acaoDisponivel(licao, estado, [1])).toEqual({ tipo: 'continuar' })
  })

  it('no último passo, oferece concluir', () => {
    let estado = avancar(licao, avancar(licao, estadoInicial()))
    estado = responder(licao, estado, 2, [0, 2])
    expect(acaoDisponivel(licao, estado, [])).toEqual({ tipo: 'concluir' })
  })
})

describe('responder', () => {
  const licao = licaoDeTeste()

  it('errar não bloqueia o avanço', () => {
    let estado = avancar(licao, estadoInicial())
    estado = responder(licao, estado, 1, [1])
    expect(estado.respostas[1]?.correta).toBe(false)
    expect(acaoDisponivel(licao, estado, []).tipo).toBe('continuar')
  })

  it('conta as tentativas acumuladas', () => {
    let estado = avancar(licao, estadoInicial())
    estado = responder(licao, estado, 1, [1])
    estado = responder(licao, estado, 1, [0])
    expect(estado.respostas[1]?.tentativas).toBe(2)
    expect(estado.respostas[1]?.correta).toBe(true)
  })

  it('ignora índice que não é quiz', () => {
    const estado = responder(licao, estadoInicial(), 0, [0])
    expect(estado.respostas[0]).toBeUndefined()
  })
})

describe('xpGanho', () => {
  const licao = licaoDeTeste()

  it('dá o XP cheio quando tudo sai de primeira', () => {
    let estado = estadoInicial()
    estado = responder(licao, estado, 1, [0])
    estado = responder(licao, estado, 2, [0, 2])
    expect(xpGanho(licao, estado)).toBe(20)
  })

  it('nunca desce abaixo de 40% mesmo errando tudo', () => {
    let estado = estadoInicial()
    estado = responder(licao, estado, 1, [1])
    estado = responder(licao, estado, 2, [1])
    expect(xpGanho(licao, estado)).toBe(8)
  })

  it('acertar na segunda tentativa vale menos que acertar de primeira', () => {
    let comErro = estadoInicial()
    comErro = responder(licao, comErro, 1, [1])
    comErro = responder(licao, comErro, 1, [0])
    comErro = responder(licao, comErro, 2, [0, 2])

    let semErro = estadoInicial()
    semErro = responder(licao, semErro, 1, [0])
    semErro = responder(licao, semErro, 2, [0, 2])

    expect(xpGanho(licao, comErro)).toBeLessThan(xpGanho(licao, semErro))
  })
})

describe('progresso', () => {
  const licao = licaoDeTeste()

  it('começa em zero e chega a um', () => {
    expect(progresso(licao, estadoInicial())).toBe(0)
    expect(progresso(licao, { ...estadoInicial(), concluida: true })).toBe(1)
  })

  it('avança junto com os passos revelados', () => {
    const estado = avancar(licao, estadoInicial())
    expect(progresso(licao, estado)).toBeCloseTo(1 / 3)
  })
})

describe('avancar', () => {
  const licao = licaoDeTeste()

  it('conclui ao passar do último passo', () => {
    let estado = estadoInicial()
    estado = avancar(licao, estado)
    estado = avancar(licao, estado)
    expect(estado.concluida).toBe(false)
    estado = avancar(licao, estado)
    expect(estado.concluida).toBe(true)
  })
})
