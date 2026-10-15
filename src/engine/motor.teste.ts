import { describe, expect, it } from 'vitest'
import { licao as esquemaLicao } from '@conteudo/schema/schema.ts'
import type { Licao } from '@conteudo/schema/schema.ts'
import {
  VAZIO,
  acaoDisponivel,
  acertosPorPosicao,
  avancar,
  corrigir,
  corrigirQuiz,
  ehCorrigido,
  ehInterativo,
  embaralharDeslocado,
  embaralharEstavel,
  estadoInicial,
  progresso,
  quantidadeEsperada,
  responder,
  selecaoCompleta,
  xpGanho,
} from './motor'

/**
 * As fixtures passam pelo schema de verdade, não por um `as`. Assim elas
 * ganham os valores padrão e, de quebra, o teste falha se o schema e o motor
 * saírem de sincronia.
 */
function montar(passos: unknown[]): Licao {
  return esquemaLicao.parse({
    id: 'teste',
    titulo: 'Lição de teste',
    objetivo: 'testar o motor',
    duracao_min: 5,
    xp: 20,
    passos,
  })
}

const QUIZ_UNICO = {
  tipo: 'quiz',
  pergunta: 'quanto é 2 bits?',
  embaralhar: false,
  alternativas: [
    { texto: '4', correta: true },
    { texto: '2', correta: false },
  ],
}

const QUIZ_MULTIPLO = {
  tipo: 'quiz',
  pergunta: 'quais são pares?',
  embaralhar: false,
  alternativas: [
    { texto: '2', correta: true },
    { texto: '3', correta: false },
    { texto: '4', correta: true },
  ],
}

const LACUNA = {
  tipo: 'lacuna',
  enunciado: 'Escolher entre categorias é {{classificação}}; prever um número é {{regressão}}.',
  distratores: ['média'],
}

const ORDENAR = {
  tipo: 'ordenar',
  instrucao: 'Coloque na ordem.',
  itens: ['Olhe para os dois lados', 'Atravesse', 'Chegue do outro lado'],
}

const ASSOCIAR = {
  tipo: 'associar',
  instrucao: 'Ligue os pares.',
  pares: [
    { termo: 'Bit', definicao: 'A menor unidade de informação' },
    { termo: 'Algoritmo', definicao: 'Sequência de passos sem ambiguidade' },
  ],
}

const CLASSIFICAR = {
  tipo: 'classificar',
  instrucao: 'Separe os problemas.',
  categorias: ['Classificação', 'Regressão'],
  itens: [
    { texto: 'O exame deu positivo?', categoria: 'Classificação' },
    { texto: 'Quantos leitos em julho?', categoria: 'Regressão' },
  ],
}

const REFLEXAO = {
  tipo: 'reflexao',
  pergunta: 'Qual problema do seu bairro daria para resolver com dados?',
}

const TEXTO = { tipo: 'texto', conteudo: 'olá' }

/* -------------------------------------------------------------------------- */

describe('classificação dos passos', () => {
  const licao = montar([TEXTO, QUIZ_UNICO, LACUNA, REFLEXAO])

  it('separa corrigidos de não corrigidos', () => {
    expect(ehCorrigido(licao.passos[0]!)).toBe(false)
    expect(ehCorrigido(licao.passos[1]!)).toBe(true)
    expect(ehCorrigido(licao.passos[2]!)).toBe(true)
    expect(ehCorrigido(licao.passos[3]!)).toBe(false)
  })

  it('trata reflexão como interativa, mas não corrigida', () => {
    expect(ehInterativo(licao.passos[3]!)).toBe(true)
    expect(ehCorrigido(licao.passos[3]!)).toBe(false)
  })

  it('passo marcado como opcional deixa de exigir resposta', () => {
    const opcional = montar([{ ...QUIZ_UNICO, opcional: true }])
    expect(ehInterativo(opcional.passos[0]!)).toBe(false)
  })
})

describe('quantidadeEsperada', () => {
  it('conta as lacunas do enunciado', () => {
    expect(quantidadeEsperada(montar([LACUNA]).passos[0]!)).toBe(2)
  })

  it('conta itens, pares e categorias conforme o tipo', () => {
    expect(quantidadeEsperada(montar([ORDENAR]).passos[0]!)).toBe(3)
    expect(quantidadeEsperada(montar([ASSOCIAR]).passos[0]!)).toBe(2)
    expect(quantidadeEsperada(montar([CLASSIFICAR]).passos[0]!)).toBe(2)
  })

  it('é zero para passos sem posições', () => {
    expect(quantidadeEsperada(montar([TEXTO]).passos[0]!)).toBe(0)
  })
})

describe('corrigirQuiz', () => {
  const unico = montar([QUIZ_UNICO]).passos[0]!
  const multiplo = montar([QUIZ_MULTIPLO]).passos[0]!

  it('aceita a alternativa correta', () => {
    expect(corrigir(unico, [0])).toBe(true)
  })

  it('rejeita a alternativa errada', () => {
    expect(corrigir(unico, [1])).toBe(false)
  })

  it('exige todas as corretas quando há mais de uma', () => {
    expect(corrigir(multiplo, [0, 2])).toBe(true)
    expect(corrigir(multiplo, [0])).toBe(false)
  })

  it('rejeita quando sobra uma alternativa errada junto das certas', () => {
    expect(corrigir(multiplo, [0, 1, 2])).toBe(false)
  })

  it('rejeita seleção vazia', () => {
    expect(corrigir(unico, [])).toBe(false)
  })

  it('ignora a ordem em que as alternativas foram marcadas', () => {
    expect(corrigirQuiz([{ correta: true }, { correta: false }, { correta: true }], [2, 0])).toBe(
      true,
    )
  })
})

describe('corrigir — lacuna, ordenar e associar', () => {
  // Nestes três a ordem do conteúdo é a correta, então o gabarito é [0, 1, ...].
  it.each([
    ['lacuna', LACUNA, [0, 1]],
    ['ordenar', ORDENAR, [0, 1, 2]],
    ['associar', ASSOCIAR, [0, 1]],
  ])('%s: aceita a ordem do conteúdo', (_nome, bruto, gabarito) => {
    const passo = montar([bruto]).passos[0]!
    expect(corrigir(passo, gabarito)).toBe(true)
  })

  it.each([
    ['lacuna', LACUNA, [1, 0]],
    ['ordenar', ORDENAR, [1, 0, 2]],
    ['associar', ASSOCIAR, [1, 0]],
  ])('%s: rejeita posições trocadas', (_nome, bruto, trocado) => {
    const passo = montar([bruto]).passos[0]!
    expect(corrigir(passo, trocado)).toBe(false)
  })

  it('lacuna: rejeita distrator, mesmo com a outra lacuna certa', () => {
    const passo = montar([LACUNA]).passos[0]!
    // índice 2 é "média", o distrator
    expect(corrigir(passo, [0, 2])).toBe(false)
    expect(acertosPorPosicao(passo, [0, 2])).toEqual([true, false])
  })

  it('rejeita resposta incompleta', () => {
    const passo = montar([ORDENAR]).passos[0]!
    expect(corrigir(passo, [0, 1])).toBe(false)
    expect(corrigir(passo, [0, VAZIO, 2])).toBe(false)
  })
})

describe('corrigir — classificar', () => {
  const passo = montar([CLASSIFICAR]).passos[0]!

  it('aceita cada item na sua categoria', () => {
    expect(corrigir(passo, [0, 1])).toBe(true)
  })

  it('rejeita itens trocados de caixa', () => {
    expect(corrigir(passo, [1, 0])).toBe(false)
    expect(acertosPorPosicao(passo, [1, 0])).toEqual([false, false])
  })

  it('aponta acerto parcial item a item', () => {
    expect(acertosPorPosicao(passo, [0, 0])).toEqual([true, false])
  })

  it('trata item sem categoria como erro, não como exceção', () => {
    expect(acertosPorPosicao(passo, [VAZIO, 1])).toEqual([false, true])
    expect(corrigir(passo, [VAZIO, 1])).toBe(false)
  })
})

describe('selecaoCompleta', () => {
  it('quiz: basta uma alternativa marcada', () => {
    const passo = montar([QUIZ_UNICO]).passos[0]!
    expect(selecaoCompleta(passo, [], '')).toBe(false)
    expect(selecaoCompleta(passo, [1], '')).toBe(true)
  })

  it('exige todas as posições preenchidas nos exercícios de colocação', () => {
    const passo = montar([CLASSIFICAR]).passos[0]!
    expect(selecaoCompleta(passo, [0], '')).toBe(false)
    expect(selecaoCompleta(passo, [0, VAZIO], '')).toBe(false)
    expect(selecaoCompleta(passo, [0, 1], '')).toBe(true)
  })

  it('reflexão: exige algum texto, e espaço em branco não conta', () => {
    const passo = montar([REFLEXAO]).passos[0]!
    expect(selecaoCompleta(passo, [], '')).toBe(false)
    expect(selecaoCompleta(passo, [], '   \n ')).toBe(false)
    expect(selecaoCompleta(passo, [], 'uma ideia')).toBe(true)
  })

  it('passo de leitura está sempre pronto para avançar', () => {
    expect(selecaoCompleta(montar([TEXTO]).passos[0]!, [], '')).toBe(true)
  })
})

describe('acaoDisponivel', () => {
  const licao = montar([TEXTO, QUIZ_UNICO, REFLEXAO])

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

  it('numa reflexão, depende do texto', () => {
    const estado = avancar(licao, avancar(licao, estadoInicial()))
    expect(acaoDisponivel(licao, estado, [], '')).toEqual({ tipo: 'verificar', habilitada: false })
    expect(acaoDisponivel(licao, estado, [], 'penso que')).toEqual({
      tipo: 'verificar',
      habilitada: true,
    })
  })

  it('no último passo já respondido, oferece concluir', () => {
    let estado = avancar(licao, avancar(licao, estadoInicial()))
    estado = responder(licao, estado, 2, [], 'minha ideia')
    expect(acaoDisponivel(licao, estado, [])).toEqual({ tipo: 'concluir' })
  })
})

describe('responder', () => {
  const licao = montar([TEXTO, QUIZ_UNICO, REFLEXAO])

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

  it('guarda o texto da reflexão e a trata como sempre correta', () => {
    const estado = responder(licao, estadoInicial(), 2, [], 'minha resposta')
    expect(estado.respostas[2]?.texto).toBe('minha resposta')
    expect(estado.respostas[2]?.correta).toBe(true)
  })

  it('ignora índice que não é interativo', () => {
    const estado = responder(licao, estadoInicial(), 0, [0])
    expect(estado.respostas[0]).toBeUndefined()
  })
})

describe('xpGanho', () => {
  const licao = montar([QUIZ_UNICO, QUIZ_MULTIPLO])

  it('dá o XP cheio quando tudo sai de primeira', () => {
    let estado = responder(licao, estadoInicial(), 0, [0])
    estado = responder(licao, estado, 1, [0, 2])
    expect(xpGanho(licao, estado)).toBe(20)
  })

  it('nunca desce abaixo de 40% mesmo errando tudo', () => {
    let estado = responder(licao, estadoInicial(), 0, [1])
    estado = responder(licao, estado, 1, [1])
    expect(xpGanho(licao, estado)).toBe(8)
  })

  it('acertar na segunda tentativa vale menos que acertar de primeira', () => {
    let comErro = responder(licao, estadoInicial(), 0, [1])
    comErro = responder(licao, comErro, 0, [0])
    comErro = responder(licao, comErro, 1, [0, 2])

    let semErro = responder(licao, estadoInicial(), 0, [0])
    semErro = responder(licao, semErro, 1, [0, 2])

    expect(xpGanho(licao, comErro)).toBeLessThan(xpGanho(licao, semErro))
  })

  it('reflexão não entra na conta — não tem resposta certa', () => {
    const comReflexao = montar([QUIZ_UNICO, REFLEXAO])
    let estado = responder(comReflexao, estadoInicial(), 0, [0])
    estado = responder(comReflexao, estado, 1, [], 'qualquer coisa')
    expect(xpGanho(comReflexao, estado)).toBe(20)
  })

  it('lição sem nenhum exercício corrigido vale o XP cheio', () => {
    const soLeitura = montar([TEXTO, REFLEXAO])
    expect(xpGanho(soLeitura, estadoInicial())).toBe(20)
  })
})

describe('progresso', () => {
  const licao = montar([TEXTO, QUIZ_UNICO, REFLEXAO])

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
  const licao = montar([TEXTO, QUIZ_UNICO, REFLEXAO])

  it('conclui ao passar do último passo', () => {
    let estado = avancar(licao, estadoInicial())
    estado = avancar(licao, estado)
    expect(estado.concluida).toBe(false)
    estado = avancar(licao, estado)
    expect(estado.concluida).toBe(true)
  })
})

describe('embaralhamento', () => {
  it('é estável para a mesma semente', () => {
    expect(embaralharEstavel(6, 3)).toEqual(embaralharEstavel(6, 3))
  })

  it('muda entre sementes diferentes', () => {
    expect(embaralharEstavel(8, 1)).not.toEqual(embaralharEstavel(8, 2))
  })

  it('devolve uma permutação completa, sem perder nem repetir', () => {
    const ordem = embaralharEstavel(10, 42)
    expect([...ordem].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('embaralhado deslocado nunca deixa item na posição de origem', () => {
    // Um exercício de ordenar que abre já resolvido é bug, não sorte.
    for (let tamanho = 2; tamanho <= 8; tamanho++) {
      for (let semente = 0; semente < 40; semente++) {
        const ordem = embaralharDeslocado(tamanho, semente)
        expect([...ordem].sort((a, b) => a - b)).toEqual(
          Array.from({ length: tamanho }, (_, i) => i),
        )
        expect(
          ordem.every((valor, posicao) => valor !== posicao),
          `tamanho ${tamanho}, semente ${semente}: ${ordem.join(',')}`,
        ).toBe(true)
      }
    }
  })

  it('lida com listas de 0 e 1 item sem quebrar', () => {
    expect(embaralharDeslocado(0, 1)).toEqual([])
    expect(embaralharDeslocado(1, 1)).toEqual([0])
  })
})
