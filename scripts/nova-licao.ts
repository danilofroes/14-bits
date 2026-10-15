/**
 * `npm run nova:licao` — cria o esqueleto de uma lição.
 *
 * Existe para que a métrica de aceite da arquitetura (criar uma lição em até
 * 30 minutos — PLANEJAMENTO.md §9) não seja gasta procurando onde o arquivo
 * vai e qual é o formato.
 *
 * Uso:
 *   npm run nova:licao -- <id-da-trilha> <id-do-modulo> <id-da-licao> "Título"
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { carregarConteudo } from '../conteudo/schema/carregar.ts'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const [idTrilha, idModulo, idLicao, ...restoTitulo] = process.argv.slice(2)
const titulo = restoTitulo.join(' ')

function sair(mensagem: string): never {
  console.error(`\x1b[31m${mensagem}\x1b[0m`)
  return process.exit(1)
}

if (!idTrilha || !idModulo || !idLicao) {
  sair(
    'Uso: npm run nova:licao -- <id-da-trilha> <id-do-modulo> <id-da-licao> "Título"\n\n' +
      'Exemplo:\n' +
      '  npm run nova:licao -- como-o-computador-pensa o-comeco logica-booleana "Verdadeiro e falso"',
  )
}

if (!/^[a-z0-9-]+$/.test(idLicao)) {
  sair(`id inválido: "${idLicao}". Use minúsculas, números e hífen — sem acento.`)
}

/* --- localiza a trilha -------------------------------------------------- */

const { conteudo } = carregarConteudo(raiz)
const trilha = conteudo.trilhas.find((t) => t.id === idTrilha)

if (!trilha) {
  const disponiveis = conteudo.trilhas.map((t) => `  ${t.id}`).join('\n')
  sair(`Trilha "${idTrilha}" não existe.\n\nTrilhas disponíveis:\n${disponiveis || '  (nenhuma)'}`)
}

const modulo = trilha.modulos.find((m) => m.id === idModulo)
if (!modulo) {
  const disponiveis = trilha.modulos.map((m) => `  ${m.id}`).join('\n')
  sair(`Módulo "${idModulo}" não existe na trilha "${idTrilha}".\n\nMódulos:\n${disponiveis}`)
}

if (trilha.licoes[idLicao]) {
  sair(`Já existe uma lição "${idLicao}" nesta trilha.`)
}

/* --- descobre a pasta da trilha no disco -------------------------------- */

const raizTrilhas = join(raiz, 'conteudo', 'trilhas')
const { readdirSync, statSync } = await import('node:fs')
const pastaTrilha = readdirSync(raizTrilhas)
  .filter((p) => statSync(join(raizTrilhas, p)).isDirectory())
  .find((p) => {
    const arquivo = join(raizTrilhas, p, 'trilha.yaml')
    if (!existsSync(arquivo)) return false
    const dados = parseYaml(readFileSync(arquivo, 'utf8')) as { id?: string }
    return dados.id === idTrilha
  })

if (!pastaTrilha) sair(`Não achei a pasta da trilha "${idTrilha}" no disco.`)

/* --- cria o arquivo ----------------------------------------------------- */

const destino = join(raizTrilhas, pastaTrilha, idModulo, idLicao)
mkdirSync(destino, { recursive: true })

const modelo = `# yaml-language-server: $schema=../../../../schema/licao.schema.json
id: ${idLicao}
titulo: ${titulo || 'Sem título ainda'}
objetivo: O que a pessoa sai sabendo fazer depois desta lição.
duracao_min: 5
xp: 20
conceitos: []

passos:
  - tipo: texto
    conteudo: |
      Abra com algo concreto — uma cena, um problema do dia a dia. A ideia
      abstrata vem depois, nunca antes.

  - tipo: quiz
    pergunta: Uma pergunta que só faz sentido para quem entendeu o texto acima.
    alternativas:
      - texto: A alternativa certa
        correta: true
        feedback: Confirme o raciocínio, não só o acerto.
      - texto: Um erro que as pessoas realmente cometem
        feedback: |
          Explique por que essa parece certa e onde ela escorrega. O feedback
          do erro é onde o ensino acontece de verdade.

  - tipo: destaque
    estilo: dica
    conteudo: |
      Feche com a ideia que a pessoa precisa levar embora.
`

const arquivo = join(destino, 'licao.yaml')
writeFileSync(arquivo, modelo)

/* --- lembra de registrar no trilha.yaml --------------------------------- */

const relativo = arquivo.replace(raiz, '').replace(/\\/g, '/').replace(/^\//, '')

console.log(`\x1b[32mlição criada\x1b[0m  ${relativo}\n`)
console.log('Falta um passo: registre a lição no módulo, em')
console.log(`  conteudo/trilhas/${pastaTrilha}/trilha.yaml\n`)
console.log(`  modulos:`)
console.log(`    - id: ${idModulo}`)
console.log(`      licoes:`)
for (const existente of modulo.licoes) console.log(`        - ${existente}`)
console.log(`\x1b[32m        - ${idLicao}\x1b[0m          <- acrescente esta linha\n`)
console.log('Depois rode  npm run validar  para conferir.')
