# 14-Bits — Arquitetura de Conteúdo

> Complemento do [PLANEJAMENTO.md](PLANEJAMENTO.md). Define **como uma lição é escrita** — o formato, os tipos de bloco e o catálogo de simuladores.
> Revisão 2 — 31/08/2026 · Status: **aprovado, liberado para implementação**

---

## 1. O princípio

> **Conteúdo é dado, não é código.**

Criar uma lição nova nunca deve exigir abrir um arquivo `.tsx`. O fluxo de autoria é:

```
npm run nova:licao   →  escrever o YAML  →  npm run validar  →  commit
```

Se em algum momento adicionar conteúdo exigir escrever React, a arquitetura falhou e precisa de um tipo de bloco novo — não de uma exceção.

---

## 2. Hierarquia

```
Trilha          "Como o computador aprende"
└── Módulo      "Aprendizado supervisionado"
    └── Lição   "Classificação: separando o joio do trigo"    (5–8 min)
        └── Passo  um texto, um quiz, um simulador...          (10–30s cada)
```

**Regras de dimensionamento:**

| Nível  | Regra                                                         |
| ------ | ------------------------------------------------------------- |
| Trilha | 3–5 módulos                                                   |
| Módulo | 3–6 lições                                                    |
| Lição  | 6–12 passos, **sempre terminável numa sentada**               |
| Passo  | uma ideia só; se precisar de "e além disso", vira outro passo |

Lição longa é o erro mais comum em app de ensino. Se passar de 12 passos, quebre em duas.

---

## 3. Formato de autoria: YAML

**Por que YAML e não JSON:** texto multilinha sem escapar aspas, comentários permitidos, markdown embutido legível. O YAML é validado contra JSON Schema e compilado para JSON no build — você escreve no formato confortável, o app consome o formato rápido.

**Idioma:** todas as chaves são em português, sem acento e sem cedilha (`licao`, `duracao_min`). Os tipos TypeScript espelham essas chaves exatamente — `Trilha`, `Licao`, `Passo` — para que código e conteúdo usem a mesma palavra e ninguém precise traduzir de cabeça. Regra completa em [PLANEJAMENTO.md §6.3](PLANEJAMENTO.md).

### 3.1. Arquivo de trilha

`conteudo/trilhas/02-como-o-computador-aprende/trilha.yaml`

```yaml
id: como-o-computador-aprende
titulo: Como o computador aprende
subtitulo: De regras escritas à máquina que descobre sozinha
icone: cerebro
cor: violeta
ordem: 2
descricao: |
  Aqui está o coração do curso. Você vai entender o que muda quando
  paramos de dizer ao computador **o que fazer** e passamos a mostrar
  **exemplos** para ele descobrir sozinho.
requisitos:
  - como-o-computador-pensa # trilha que precisa estar concluída
modulos:
  - id: mudanca-de-chave
    titulo: A mudança de chave
    licoes: [programacao-vs-ml, onde-ml-faz-sentido]
  - id: supervisionado
    titulo: Aprendizado supervisionado
    licoes: [classificacao, regressao, treino-e-teste, erro-e-acerto, overfitting]
  - id: redes-neurais
    titulo: Redes neurais
    licoes: [neuronio-artificial, camadas, deep-learning]
  - id: reforco
    titulo: Aprendizado por reforço
    licoes: [tentativa-e-erro, onde-se-usa]
```

### 3.2. Arquivo de lição

`conteudo/trilhas/02-como-o-computador-aprende/supervisionado/classificacao/licao.yaml`

```yaml
id: classificacao
titulo: Classificação
objetivo: Reconhecer um problema de classificação e explicar como a máquina traça a separação.
duracao_min: 6
xp: 20
conceitos: [classificacao, rotulo, atributo, fronteira-de-decisao]

passos:
  - tipo: texto
    conteudo: |
      Imagine uma pilha de fichas de pacientes. Você precisa separar em
      **"provável dengue"** e **"provavelmente não"**.

      Você não tem uma fórmula. Tem exemplos antigos, já com a resposta.
      Isso é **classificação**: colocar cada caso numa caixa.

  - tipo: destaque
    estilo: dica
    conteudo: |
      Classificação sempre responde a uma pergunta de **categoria**:
      qual delas? — não *quanto*.

  - tipo: quiz
    pergunta: Qual destes é um problema de classificação?
    alternativas:
      - texto: Prever quantos casos de dengue teremos na semana que vem
        correta: false
        feedback: Esse é um número, uma quantidade. Isso é **regressão** — próxima lição.
      - texto: Decidir se um e-mail é spam ou não
        correta: true
        feedback: Isso mesmo. Duas caixas possíveis, e cada e-mail cai numa delas.
      - texto: Estimar a temperatura de amanhã
        correta: false
        feedback: Temperatura é um valor contínuo, então é regressão.

  - tipo: simulador
    widget: classificador-fronteira
    titulo: Trace a separação
    instrucao: Arraste a linha para separar os pontos azuis dos laranjas.
    params:
      dataset: duas-nuvens
      mostrar_erros: true
    alternativa_texto: |
      Um gráfico com dois grupos de pontos. Ao mover a linha divisória,
      o número de pontos classificados errado aumenta ou diminui.
    pergunta_apos: Foi possível acertar 100%? Por que não?

  - tipo: classificar
    instrucao: Arraste cada problema para a caixa certa.
    categorias: [Classificação, Regressão]
    itens:
      - texto: Este exame deu positivo ou negativo?
        categoria: Classificação
      - texto: Quantos leitos vamos precisar em julho?
        categoria: Regressão
      - texto: Esta clínica está em risco de surto?
        categoria: Classificação
      - texto: Qual será a temperatura média do mês?
        categoria: Regressão

  - tipo: lacuna
    conteudo: |
      Quando a máquina precisa escolher entre categorias, chamamos de
      {{classificação}}. A linha que ela desenha para separar os grupos
      é a {{fronteira de decisão}}.
    banco: [classificação, regressão, fronteira de decisão, média]

  - tipo: reflexao
    pergunta: |
      Pense no seu bairro. Qual problema do dia a dia poderia ser
      resolvido separando coisas em categorias?
    dica: Não existe resposta errada — é para você levar para a aula.
```

Isso é uma lição inteira. Sem uma linha de código.

---

## 4. Catálogo de tipos de bloco

### 4.1. Exposição

| Tipo             | Uso                                          | Campos principais           |
| ---------------- | -------------------------------------------- | --------------------------- |
| `texto`          | Explicação em markdown                       | `conteudo`                  |
| `destaque`       | Caixa de dica / atenção / curiosidade        | `estilo`, `conteudo`        |
| `imagem`         | Ilustração ou diagrama SVG                   | `arquivo`, `alt`, `legenda` |
| `comparacao`     | Dois lados lado a lado (ex.: antes × depois) | `esquerda`, `direita`       |
| `linha-do-tempo` | Sequência histórica ou de etapas             | `eventos[]`                 |

### 4.2. Verificação

| Tipo               | Uso                                    | Por que existe                                            |
| ------------------ | -------------------------------------- | --------------------------------------------------------- |
| `quiz`             | Múltipla escolha, 1 ou várias corretas | Verificação básica                                        |
| `verdadeiro-falso` | Afirmação para julgar                  | Rápido, bom para desfazer mito                            |
| `lacuna`           | Preencher lacunas a partir de um banco | Fixa vocabulário técnico                                  |
| `ordenar`          | Colocar passos na ordem certa          | **Ideal para algoritmo e pseudocódigo**                   |
| `associar`         | Ligar pares termo ↔ definição          | Glossário ativo                                           |
| `classificar`      | Arrastar itens para categorias         | **Ideal para "isto é classificação ou regressão?"**       |
| `montar`           | Montar pseudocódigo a partir de blocos | Estilo Mimo, sem exigir digitar código                    |
| `cenario`          | Caso com decisões encadeadas           | Aprendizagem Baseada em Problemas (PBL, §4.3.3 do edital) |

### 4.3. Interação e abertura

| Tipo        | Uso                                                                         |
| ----------- | --------------------------------------------------------------------------- |
| `simulador` | Widget interativo do catálogo (§5)                                          |
| `reflexao`  | Resposta aberta, salva localmente, sem correção                             |
| `enquete`   | Pergunta rápida de turma — resultado agregado na tela do professor (fase 2) |

### 4.4. Campos comuns a todos os blocos

```yaml
tipo: <obrigatório>
id: <opcional; gerado se ausente>
feedback_acerto: <opcional; texto ao acertar>
feedback_erro: <opcional; texto ao errar>
conceitos: [<opcional; liga ao glossário>]
opcional: false # se true, não conta para conclusão
```

---

## 5. Catálogo de simuladores

Os simuladores são o que separa este app de um formulário de quiz. Cada um é um componente React registrado por `id` e chamado do YAML por nome — o conteúdo continua declarativo.

```
src/simuladores/registry.ts   →  { 'classificador-fronteira': ClassificadorFronteira, ... }
```

### 5.1. Trilha 1 — Como o computador pensa

| Widget             | O que o aluno faz                             | Intuição construída                 |
| ------------------ | --------------------------------------------- | ----------------------------------- |
| `binario-contador` | Liga e desliga 8 bits                         | Número é combinação de liga/desliga |
| `porta-logica`     | Aciona chaves em AND / OR / NOT               | Decisão nasce de lógica simples     |
| `fluxo-algoritmo`  | Executa um pseudocódigo passo a passo         | Programa é sequência, não mágica    |
| `receita-ambigua`  | Dá instruções vagas a um robô e vê dar errado | Por que o computador exige precisão |

### 5.2. Trilha 2 — Como o computador aprende

| Widget                    | O que o aluno faz                                         | Intuição construída                  |
| ------------------------- | --------------------------------------------------------- | ------------------------------------ |
| `regressao-reta`          | Arrasta uma reta sobre pontos e vê o erro cair            | O que é "ajustar um modelo"          |
| `classificador-fronteira` | Move a fronteira entre dois grupos                        | Classificação é traçar separação     |
| `knn-vizinhos`            | Coloca um ponto novo e vê os vizinhos votarem             | Aprender por semelhança              |
| `arvore-decisao`          | Clica em cortes num gráfico                               | Regra encadeada = árvore             |
| `neuronio`                | Ajusta pesos de um perceptron de 2 entradas               | Neurônio é soma com pesos            |
| `rede-camadas`            | Observa ativações atravessando camadas                    | Profundidade = composição de padrões |
| `overfitting`             | Move um controle de complexidade e compara treino × teste | **Decorar não é aprender**           |
| `rl-grade`                | Um agente busca recompensa num labirinto                  | Tentativa, erro e recompensa         |

`overfitting` é o simulador mais importante da trilha. É o conceito que mais gera "aha" e o que mais é mal explicado por aí.

### 5.3. Trilha 3 — Os dados

| Widget           | O que o aluno faz                                    | Intuição construída             |
| ---------------- | ---------------------------------------------------- | ------------------------------- |
| `planilha-suja`  | Corrige valores faltantes, duplicados e absurdos     | Dado bruto nunca vem pronto     |
| `vies-amostra`   | Coleta uma amostra enviesada e vê o modelo errar     | **Dado ruim, modelo ruim**      |
| `criar-atributo` | Deriva uma coluna nova (ex.: casos por 100 mil hab.) | O que é engenharia de atributos |
| `anonimizar`     | Decide o que pode ou não sair de uma base            | LGPD na prática                 |

### 5.4. Trilha 4 — SALVE

| Widget              | O que o aluno faz                                 | Intuição construída                                   |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `chuva-e-casos`     | Desliza semanas e compara chuva × casos de dengue | Variável ambiental prevê doença                       |
| `matriz-confusao`   | Move o limiar e observa VP / FP / VN / FN         | **Por que Recall importa mais que acurácia na saúde** |
| `alerta-antecipado` | Compara reagir depois × prever antes              | O argumento central do SALVE                          |

`matriz-confusao` é a ponte direta com a §4.4.2 do edital — falso negativo como maior risco sanitário. É o simulador que transforma a sua pesquisa em aula.

### 5.5. Contrato obrigatório de todo simulador

Todo widget precisa, sem exceção:

1. Funcionar com **toque** (o público está no celular), não só com mouse
2. Ter `alternativa_texto` — descrição para leitor de tela
3. Ter estado inicial útil — nada de tela em branco esperando ação
4. Ter botão **reiniciar**
5. Renderizar em SVG (leve, escalável, tema claro/escuro)
6. **Nunca bloquear o avanço** — explorar é opcional, entender é o objetivo

---

## 6. Glossário

`conteudo/glossario.yaml` é fonte única. Qualquer bloco cita um conceito e o termo vira tocável na lição.

```yaml
- termo: overfitting
  traducao: sobreajuste
  curta: Quando o modelo decora os exemplos em vez de aprender a regra.
  longa: |
    Um modelo com overfitting acerta quase tudo nos dados que já viu e
    erra feio em dados novos. É o aluno que decorou a prova antiga.
  ver_tambem: [treino-e-teste, generalizacao]
  aparece_em: [overfitting, treino-e-teste]
```

Ganho colateral: dá para gerar o **guia impresso de apoio** (prometido no edital) direto do glossário, sem redigitar nada.

---

## 7. Validação automática (`npm run validar`)

Roda no CI e bloqueia merge. Verifica:

- **Schema:** todo campo obrigatório presente, tipos corretos
- **Referências:** lição citada na trilha existe; requisito aponta para trilha real
- **Quiz:** ao menos uma alternativa correta; nenhuma duplicada
- **Lacuna:** todo `{{termo}}` tem correspondente no banco
- **Classificar:** toda categoria usada foi declarada
- **Simulador:** `widget` existe no registry; `alternativa_texto` preenchido
- **Acessibilidade:** toda imagem tem `alt`
- **Glossário:** todo conceito citado existe
- **Tamanho:** lição com mais de 12 passos gera aviso
- **Órfãos:** lição no disco que nenhuma trilha referencia

Essa validação é o que permite escrever conteúdo rápido sem medo — o erro aparece no commit, não na frente da turma.

---

## 8. Ordem de implementação dos blocos

Nem tudo precisa existir no dia 1. Ordem por retorno sobre esforço:

**Onda 1 (semana 2) — destrava 80% do conteúdo:**
`texto`, `destaque`, `quiz`, `verdadeiro-falso`, `imagem`

**Onda 2 (semana 2–3) — dá variedade:**
`lacuna`, `ordenar`, `associar`, `classificar`, `reflexao`

**Onda 3 (semana 3–4) — dá alma:**
`simulador` + os 4 primeiros widgets, `comparacao`

**Onda 4 (se houver tempo):**
`montar`, `cenario`, `linha-do-tempo`, `enquete`

**Marco de validação:** ao fim da Onda 1, escrever uma lição real de ponta a ponta e cronometrar. Se passar de 30 minutos, pare e conserte a ferramenta antes de escrever mais conteúdo.

---

## 9. Ponto reservado para a fase 2

O bloco `enquete` pressupõe um "modo professor" com resultado agregado ao vivo — o que exige backend e portanto sai do MVP. Fica **reservado no schema, sem implementação**: o campo é aceito pelo validador e ignorado pelo motor.

Motivo de manter o espaço: se em novembro você adicionar a API Flask para métricas do relatório final, a enquete vira quase de graça. Se não adicionar, nada quebra.

---

## 10. Lição inaugural sugerida

A primeira lição da Trilha 1 pode abrir com **"por que 14 bits?"** e chegar em 2¹⁴ = 16.384 combinações. O aluno aprende o conceito de binário explicando o nome do app que tem na mão — o simulador `binario-contador` cai exatamente aí, com 14 bits em vez de 8.
