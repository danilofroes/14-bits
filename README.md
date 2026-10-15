# 14-Bits

> **Faça seu primeiro voo.**

App de aprendizagem do curso de introdução a _Machine Learning_ da **Nave do Conhecimento**, parte do projeto [SALVE](docs/PLANEJAMENTO.md) no edital **Bora Fazer 2026** (Programa Jovens Cientistas Cariocas — SMCTI Rio & CIEDS).

O nome homenageia o **14-bis** de Santos Dumont, que em 1906 voou 60 metros a 3 de altura e mudou a ideia que o mundo tinha do que era possível. E, com t, são 14 bits — as 16.384 combinações que a primeira lição do curso ensina.

---

## Para quem vai escrever conteúdo

Esta é a parte importante do projeto: **você não precisa saber programar para criar uma lição.**

### Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Salvar qualquer arquivo YAML recarrega a lição na hora.

### Criando uma lição

```bash
npm run nova:licao -- como-o-computador-pensa o-comeco logica-booleana "Verdadeiro e falso"
```

O comando cria o arquivo já preenchido com um modelo comentado e diz exatamente qual linha acrescentar no `trilha.yaml`. Depois:

```bash
npm run validar
```

O validador aponta o erro com nome de arquivo e campo. Ele roda também no CI, então **conteúdo quebrado não entra no `main`** — o erro aparece no commit, nunca na frente da turma.

### Como uma lição é organizada

```
Trilha  →  Módulo  →  Lição  →  Passo
```

Uma lição tem de 6 a 12 passos e dura de 5 a 8 minutos. Se passar de 12 passos, o validador avisa: é hora de quebrar em duas.

Cada passo é de um tipo. Hoje existem três:

| Tipo       | Para quê                                                    |
| ---------- | ----------------------------------------------------------- |
| `texto`    | Explicar. Aceita `**negrito**`, `*itálico*`, `` `código` `` |
| `destaque` | Caixa de `dica`, `atencao` ou `curiosidade`                 |
| `quiz`     | Múltipla escolha, com uma ou várias respostas certas        |

Exemplo mínimo:

```yaml
id: minha-licao
titulo: O título que aparece na tela
objetivo: O que a pessoa sai sabendo fazer.
duracao_min: 5
xp: 20

passos:
  - tipo: texto
    conteudo: |
      Comece com algo concreto. A ideia abstrata vem depois.

  - tipo: quiz
    pergunta: Uma pergunta que só faz sentido para quem leu o texto acima.
    alternativas:
      - texto: A resposta certa
        correta: true
        feedback: Confirme o raciocínio, não só o acerto.
      - texto: Um erro que as pessoas realmente cometem
        feedback: |
          Explique por que essa parece certa e onde escorrega.
          O feedback do erro é onde o ensino acontece.
```

O catálogo completo de tipos de bloco e o formato de cada campo estão em [docs/ARQUITETURA-CONTEUDO.md](docs/ARQUITETURA-CONTEUDO.md).

> **Dica:** instale as extensões recomendadas do VS Code (o editor sugere ao abrir o projeto). Com elas, o YAML ganha autocomplete dos campos, gerado a partir do mesmo schema que valida.

### Três regras de escrita

1. **Uma ideia por passo.** Se precisar de "e além disso", vira outro passo.
2. **Todo erro ensina.** Escreva o `feedback` de cada alternativa errada explicando _por que_ ela parece certa.
3. **Concreto antes de abstrato.** Cena, problema ou exemplo primeiro; o nome técnico depois.

---

## Para quem vai mexer no código

### Comandos

| Comando              | O que faz                              |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Servidor local com recarga de conteúdo |
| `npm run checar`     | Lint + validação de conteúdo + testes  |
| `npm run build`      | Valida, checa tipos e gera `dist/`     |
| `npm run test:watch` | Testes em modo contínuo                |
| `npm run format`     | Formata tudo com Prettier              |

### Arquitetura em uma frase

**Conteúdo é dado, não é código.** `src/` para de crescer quando os tipos de bloco estiverem prontos; a partir daí, só `conteudo/` cresce.

```
conteudo/
  schema/       Zod — fonte única da verdade do formato
  trilhas/      todo o material didático, em YAML
src/
  engine/       motor de lição: lógica pura, sem React, testável isolada
  blocos/       um componente por tipo de passo + o registry
  simuladores/  widgets interativos (a partir da semana 3)
  design/       tokens de cor e tipografia
  progresso/    XP, ofensiva e persistência local
scripts/        validador, scaffold e o plugin que serve o conteúdo
```

### Adicionando um tipo de bloco

1. Acrescente a variante em `conteudo/schema/schema.ts`
2. Crie o componente em `src/blocos/`, seguindo `PropsBloco`
3. Registre em `src/blocos/index.tsx`

Nenhum outro arquivo precisa saber que ele existe.

### O que é cobrado no CI

- Formatação, lint e tipos
- Validação de conteúdo (schema, referências quebradas, quiz sem resposta certa, lição órfã)
- Testes unitários, incluindo **contraste de cor AA nos dois temas**
- **Orçamento de performance: 250 KB de JS comprimido** — o build falha se estourar

### Decisões que já estão tomadas

Sem login, sem backend, sem dado pessoal. O progresso vive no aparelho (IndexedDB). Isso é deliberado: evita tratar consentimento de menores numa oficina aberta e faz o app sobreviver ao fim do edital sem custo mensal. O raciocínio completo está em [docs/PLANEJAMENTO.md](docs/PLANEJAMENTO.md).

---

## Licenças

- **Código:** [GPL-3.0](LICENSE)
- **Conteúdo didático:** CC BY-SA 4.0 — qualquer Nave, escola ou professor pode reusar e adaptar, citando a fonte.

---

Desenvolvido por **Danilo Davi Gomes Fróes** — Engenharia Eletrônica e de Computação, UFRJ.
