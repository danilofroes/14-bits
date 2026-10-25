/**
 * Traços de execução dos algoritmos acompanhados pelo simulador de fluxo.
 *
 * Em vez de interpretar pseudocódigo de verdade — o que exigiria uma linguagem,
 * um parser e um interpretador — cada algoritmo é escrito aqui em TypeScript e
 * **grava o que foi acontecendo**. O simulador só navega por esse registro.
 *
 * A vantagem é que o algoritmo exibido na tela e o que gerou os números são
 * literalmente o mesmo código: não existe como a narração mentir sobre a
 * execução.
 */

export type Quadro = {
  /** Linha do pseudocódigo que acabou de rodar (índice em `linhas`). */
  linha: number
  /** Estado das variáveis depois dessa linha. */
  variaveis: Record<string, string>
  /** Qual posição da lista está sendo olhada, se alguma. */
  olhando?: number
  /** Explicação curta do que aconteceu. */
  nota: string
}

export type Traco = {
  linhas: string[]
  quadros: Quadro[]
  resultado: string
}

/* -------------------------------------------------------------------------- */

function maiorDeUmaLista(dados: number[]): Traco {
  const linhas = [
    'maior ← primeiro número da lista',
    'para cada número seguinte da lista:',
    '    se número > maior, então maior ← número',
    'mostre maior',
  ]

  const quadros: Quadro[] = []
  let maior = dados[0]!

  quadros.push({
    linha: 0,
    variaveis: { maior: String(maior) },
    olhando: 0,
    nota: `Começa assumindo que o primeiro número, ${maior}, é o maior. Não dá para começar do nada.`,
  })

  for (let i = 1; i < dados.length; i++) {
    const atual = dados[i]!

    quadros.push({
      linha: 1,
      variaveis: { maior: String(maior), número: String(atual) },
      olhando: i,
      nota: `Pega o próximo da lista: ${atual}.`,
    })

    if (atual > maior) {
      maior = atual
      quadros.push({
        linha: 2,
        variaveis: { maior: String(maior), número: String(atual) },
        olhando: i,
        nota: `${atual} é maior que o anterior, então agora o maior é ${maior}.`,
      })
    } else {
      quadros.push({
        linha: 2,
        variaveis: { maior: String(maior), número: String(atual) },
        olhando: i,
        nota: `${atual} não supera ${maior}. Nada muda e segue em frente.`,
      })
    }
  }

  quadros.push({
    linha: 3,
    variaveis: { maior: String(maior) },
    nota: `Acabou a lista. O maior era ${maior} — e bastou uma passada só.`,
  })

  return { linhas, quadros, resultado: String(maior) }
}

/* -------------------------------------------------------------------------- */

export const PROGRAMAS = {
  'maior-de-uma-lista': maiorDeUmaLista,
} as const

export type IdPrograma = keyof typeof PROGRAMAS
