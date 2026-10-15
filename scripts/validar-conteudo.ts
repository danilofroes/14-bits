/**
 * `npm run validar` — checa todo o conteúdo antes de virar build.
 *
 * Roda no CI e derruba o merge se algo estiver quebrado. É o que permite
 * escrever lição rápido sem medo: o erro aparece no commit, não na frente
 * da turma.
 */

import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import { z } from 'zod'
import { carregarConteudo } from '../conteudo/schema/carregar.ts'
import { licao, trilha } from '../conteudo/schema/schema.ts'

const raiz = fileURLToPath(new URL('..', import.meta.url))

const cor = {
  vermelho: (t: string) => `\x1b[31m${t}\x1b[0m`,
  amarelo: (t: string) => `\x1b[33m${t}\x1b[0m`,
  verde: (t: string) => `\x1b[32m${t}\x1b[0m`,
  fraco: (t: string) => `\x1b[2m${t}\x1b[0m`,
}

const { conteudo, erros, avisos } = carregarConteudo(raiz)

/* --- relatório ---------------------------------------------------------- */

for (const aviso of avisos) {
  console.log(`${cor.amarelo('aviso')}  ${cor.fraco(aviso.arquivo)}`)
  console.log(`       ${aviso.mensagem}\n`)
}

for (const erro of erros) {
  console.log(`${cor.vermelho('erro')}   ${cor.fraco(erro.arquivo)}`)
  console.log(`${erro.mensagem}\n`)
}

const totalLicoes = conteudo.trilhas.reduce((s, t) => s + Object.keys(t.licoes).length, 0)
const totalPassos = conteudo.trilhas.reduce(
  (s, t) => s + Object.values(t.licoes).reduce((p, l) => p + l.passos.length, 0),
  0,
)

if (erros.length > 0) {
  console.log(
    cor.vermelho(
      `\n${erros.length} erro(s) de conteúdo. Corrija antes de continuar.` +
        (avisos.length > 0 ? ` (${avisos.length} aviso(s))` : ''),
    ),
  )
  process.exit(1)
}

/* --- JSON Schema para autocomplete no editor ---------------------------- */
// Gerado a partir do mesmo Zod que valida, então o autocomplete nunca sai de
// sincronia com as regras reais. Os arquivos ficam no .gitignore: são
// artefato, não fonte. Ver .vscode/settings.json para a associação.

// `io: 'input'` descreve o YAML como a pessoa escreve — campos com `default`
// continuam opcionais. Com 'output' o editor exigiria preencher todos.
const paraJson = (esquema: z.ZodType) =>
  JSON.stringify(z.toJSONSchema(esquema, { io: 'input' }), null, 2)

writeFileSync(join(raiz, 'conteudo/schema/licao.schema.json'), paraJson(licao))
writeFileSync(join(raiz, 'conteudo/schema/trilha.schema.json'), paraJson(trilha))

/* --- peso do conteúdo --------------------------------------------------- */
/**
 * Hoje o conteúdo inteiro viaja dentro do bundle principal: quem abre o app
 * baixa todas as lições antes de ver a primeira tela. Isso é aceitável
 * enquanto o conteúdo é pequeno, e deixa de ser quando cresce.
 *
 * Em vez de refatorar cedo demais, este aviso marca o ponto de virada. Ao
 * passar do limite, a saída é dividir o conteúdo por trilha e carregar sob
 * demanda — o índice (títulos e durações) fica no bundle, os passos viram
 * pedaço separado.
 */
const LIMITE_CONTEUDO_GZIP = 40 * 1024

const pesoGzip = gzipSync(JSON.stringify(conteudo.trilhas)).length
const pesoFormatado = `${(pesoGzip / 1024).toFixed(1)} KB`

if (pesoGzip > LIMITE_CONTEUDO_GZIP) {
  console.log(
    cor.amarelo('aviso') +
      `  conteúdo em ${pesoFormatado} comprimidos, acima do limite de ` +
      `${(LIMITE_CONTEUDO_GZIP / 1024).toFixed(0)} KB.\n` +
      '       Hora de carregar as trilhas sob demanda em vez de embutir tudo\n' +
      '       no bundle principal. Ver o comentário em scripts/validar-conteudo.ts.\n',
  )
}

console.log(
  cor.verde('conteudo ok') +
    cor.fraco(
      `  ${conteudo.trilhas.length} trilha(s) · ${totalLicoes} lição(ões) · ${totalPassos} passo(s)` +
        ` · ${pesoFormatado} gzip` +
        (avisos.length > 0 ? ` · ${avisos.length} aviso(s)` : ''),
    ),
)
