/**
 * `npm run validar` — checa todo o conteúdo antes de virar build.
 *
 * Roda no CI e derruba o merge se algo estiver quebrado. É o que permite
 * escrever lição rápido sem medo: o erro aparece no commit, não na frente
 * da turma.
 */

import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
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

console.log(
  cor.verde('conteudo ok') +
    cor.fraco(
      `  ${conteudo.trilhas.length} trilha(s) · ${totalLicoes} lição(ões) · ${totalPassos} passo(s)` +
        (avisos.length > 0 ? ` · ${avisos.length} aviso(s)` : ''),
    ),
)
