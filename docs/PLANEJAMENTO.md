# 14-Bits — Plano de Execução

> Aplicativo de aprendizagem do curso de introdução a Machine Learning na Nave do Conhecimento.
> Projeto SALVE · Bora Fazer 2026 · Danilo Fróes (UFRJ)
>
> **Status: decisões fechadas. Liberado para implementação.**
> Revisão 2 — 31/08/2026

---

## 1. Decisões fechadas

| #   | Decisão       | Escolha                                               | Consequência                                                                                                         |
| --- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **Nome**      | **14-Bits**                                           | Identidade própria, sem herdar o SALVE. O nome é autorreferente: a Trilha 1 ensina binário e explica o próprio nome. |
| 2   | **Framework** | **Vite + React + TypeScript**, PWA instalável         | Entrega 100% online. Capacitor fica disponível para Android depois, se fizer sentido.                                |
| 3   | **Data-alvo** | App pronto em **19/10**; curso na **semana de 26/10** | Uma semana inteira de folga entre o congelamento e a primeira aula.                                                  |
| 4   | **Domínio**   | Próprio, custeado pela rubrica de oficinas (R$1.250)  | Sugestão: `14bits.com.br`                                                                                            |
| 5   | **Trilhas**   | Ementa do Danilo: **pensa → aprende → dados**         | O edital é base, não restrição — mudança já alinhada.                                                                |
| 6   | **Idioma**    | **Português 100% no que o usuário vê**; código misto  | Regra formal em §6.3.                                                                                                |
| 7   | **App Store** | **Descartada**                                        | US$99/ano não se justifica.                                                                                          |

### 1.1. Sobre o nome

Escrever **14-Bits** na comunicação (cartaz, certificado, fala) e `14bits` no domínio, pacote e repositório.

Para o domínio, recomendo **`14bits.com.br` sem hífen**: hífen se perde quando alguém dita o endereço em voz alta na sala. Se quiser, registre `14-bits.com.br` também e aponte como redirecionamento — no `.com.br` isso custa pouco. Domínio pode começar com dígito sem problema.

**Aproveite o nome como conteúdo:** a primeira lição da Trilha 1 pode abrir com "por que 14 bits?" e chegar em 2¹⁴ = 16.384 combinações. O aluno aprende binário explicando o nome do app que está usando.

---

## 2. Restrições que continuam valendo

| Fato                                                                     | Consequência                                                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Curso na semana de **26/10**, app congelado em **19/10**                 | ~7 semanas de trabalho + 1 de folga.                                                                            |
| **API Flask e front React do SALVE** correm em paralelo (§5.1 do edital) | O 14-Bits é uma terceira frente. A stack única é a principal mitigação.                                         |
| Público em território periférico                                         | Android antigo, Wi-Fi instável, franquia curta. **Peso de carregamento é requisito funcional, não otimização.** |
| Desenvolvimento em Windows                                               | Irrelevante agora que iOS saiu do escopo.                                                                       |
| Verba disponível: rubrica de oficinas (R$1.250)                          | Cobre domínio com folga. Ver §7.                                                                                |

---

## 3. Arquitetura

### 3.1. Stack

| Camada       | Escolha                                                     |
| ------------ | ----------------------------------------------------------- |
| Base         | Vite + React 18 + TypeScript                                |
| Rotas        | React Router — lição é URL, compartilhável e retomável      |
| Estado       | Zustand                                                     |
| Estilo       | Tailwind + tokens CSS (tema claro/escuro)                   |
| Animação     | Framer Motion                                               |
| Offline      | Vite PWA / Workbox                                          |
| Persistência | IndexedDB via `idb-keyval`                                  |
| Conteúdo     | YAML validado por JSON Schema, compilado para JSON no build |
| Simuladores  | SVG + `d3-scale`                                            |
| Testes       | Vitest (unidade) + Playwright (fluxo)                       |
| Qualidade    | ESLint, Prettier, Lighthouse CI                             |
| Hospedagem   | Cloudflare Pages (tier grátis)                              |

**Render e Railway permanecem reservados ao SALVE.** O 14-Bits não consome infraestrutura paga.

### 3.2. Backend: conta opcional

**Revisado em 15/10/2026.** O plano original era não ter backend nenhum. Passou a ter, com uma API Flask em `api/` — mesma stack do SALVE, no Render, com Postgres no Railway.

A decisão que mantém o risco sob controle: **a conta é opcional**. O app funciona inteiro sem ela, e quem chega pelo QR code na Nave começa a estudar em dez segundos sem digitar nada. A conta resolve um problema só — levar o progresso de um aparelho para outro.

Sobre dados pessoais, já que o público inclui adolescentes:

- Guardado: nome de usuário, e-mail, hash da senha e quais lições foram feitas.
- **Não guardado:** as reflexões (texto livre sobre a vida da pessoa, ficam só no aparelho) e XP/ofensiva (recalculados no servidor a partir das lições).
- Sem telemetria, sem IP, sem histórico.

Detalhes, rotas e decisões de segurança em [api/LEIAME.md](../api/LEIAME.md).

**Ainda pendente antes de abrir para o público:** aviso de privacidade escrito, recuperação de senha e o botão de apagar a conta (direito garantido pela LGPD).

### 3.3. Estrutura do repositório

```
app_curso_nave/
├─ .github/workflows/
│  ├─ ci.yml                  # lint · testes · validação de conteúdo
│  └─ deploy.yml              # build e publicação no Cloudflare Pages
├─ docs/
│  ├─ PLANEJAMENTO.md         # este documento
│  ├─ ARQUITETURA-CONTEUDO.md # schema de autoria e catálogo de simuladores
│  └─ adr/                    # registros de decisão arquitetural
├─ conteudo/
│  ├─ LICENSE                 # CC BY-SA 4.0
│  ├─ schema/                 # JSON Schema — fonte da verdade
│  ├─ glossario.yaml
│  └─ trilhas/
│     ├─ 00-boas-vindas/
│     ├─ 01-como-o-computador-pensa/
│     ├─ 02-como-o-computador-aprende/
│     ├─ 03-o-que-ensinamos/
│     ├─ 04-salve/
│     └─ 05-guia-stem/
├─ src/
│  ├─ app/                    # rotas, layout, providers
│  ├─ engine/                 # motor de lição: percorre, corrige, pontua
│  ├─ blocos/                 # um componente por tipo de bloco
│  ├─ simuladores/            # widgets + registry
│  ├─ design/                 # tokens, tema, componentes base
│  ├─ progresso/              # XP, ofensiva, conquistas, persistência
│  └─ lib/                    # utilidades genéricas
├─ scripts/
│  ├─ nova-licao.ts           # scaffold de lição
│  └─ validar-conteudo.ts     # validação, roda no CI
└─ public/
```

**Regra de ouro:** `src/` para de crescer quando os tipos de bloco estiverem prontos. A partir daí, só `conteudo/` cresce.

---

## 4. As trilhas

Ementa confirmada — a sua, não a do edital.

| #   | Trilha                          | Aula         | Conteúdo                                                                                                                                                                       | Lições | Prio |
| --- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---- |
| 0   | **Boas-vindas**                 | —            | Como usar o app; "por que 14 bits?"; diagnóstico leve                                                                                                                          | 2      | P0   |
| 1   | **Como o computador pensa**     | Aula 1       | Binário, lógica booleana, algoritmo, pseudocódigo, o que é uma linguagem de programação                                                                                        | 8      | P0   |
| 2   | **Como o computador aprende**   | Aula 2       | Programação tradicional × ML; padrões; classificação; regressão; treino e teste; erro; overfitting; neurônio artificial; redes neurais; deep learning; aprendizado por reforço | 12     | P0   |
| 3   | **O que ensinamos às máquinas** | Aula 3       | O que é um dado; dados abertos (DATASUS, INMET, IBGE, data.rio); qualidade; limpeza; atributos; viés; LGPD                                                                     | 8      | P0   |
| 4   | **SALVE por dentro**            | Aula 3 / pós | O caso real ponta a ponta: problema → dados → modelo → alerta; matriz de confusão; por que Recall importa mais que acurácia                                                    | 6      | P1   |
| 5   | **Guia STEM e carreira**        | Apoio        | ENEM, SISU, PROUNI, FIES; Iniciação Científica; Jovens Cientistas Cariocas; roteiro de estudo gratuito                                                                         | 5      | P0   |
| 6   | **Avançado**                    | —            | Reservado para depois do edital                                                                                                                                                | —      | P2   |

**Total do MVP: 35 lições** (Trilhas 0, 1, 2, 3, 5), estimadas em ~10,5 dias de escrita.

A **Trilha 5 é P0** porque o edital promete explicitamente (§4.3.3) guia de aprendizado gratuito e guia de carreira separados por perfil. Colocá-la no app entrega dois compromissos com um trabalho só.

A **Trilha 4 é P1**: entra se a semana 6 estiver folgada, senão vai na v1.1 depois do curso. Ela é a única cortável sem prejuízo às três aulas.

---

## 5. Conteúdo modular

Princípio único, detalhado em [ARQUITETURA-CONTEUDO.md](ARQUITETURA-CONTEUDO.md):

> **Conteúdo é dado, não é código.**

```
Trilha → Módulo → Lição → Passo
```

Criar lição = `npm run nova:licao`, escrever YAML, `npm run validar`, commit. Nunca abrir um `.tsx`.

**Métrica de aceite da arquitetura:** criar uma lição nova em **≤ 30 minutos**. Medir isso ao fim da semana 2, com uma lição real. Se passar, o problema é ferramenta — pare e conserte antes de escrever mais conteúdo.

---

## 6. Convenções

### 6.1. Gamificação

**Adotar:** XP por lição · barra de progresso da trilha · ofensiva de dias com congelamento automático · conquistas temáticas · fila de revisão dos erros · certificado ao concluir (amarra com a verba de certificados impressos).

**Não adotar:** vidas e corações (punir erro trava o aprendizado e, numa oficina presencial, gera aluno parado esperando) · ranking público por padrão (em turma pequena expõe quem tem mais dificuldade).

### 6.2. Acessibilidade — cobrada no CI

| Critério                                  | Limite                                  |
| ----------------------------------------- | --------------------------------------- |
| JavaScript inicial                        | ≤ 250 KB                                |
| Primeira tela útil em 3G simulado         | ≤ 3 s                                   |
| Contraste de texto                        | AA · 4,5:1                              |
| Alvos de toque                            | ≥ 44 px                                 |
| Escala de fonte do sistema                | até 200%                                |
| Lighthouse (performance / acessibilidade) | ≥ 90 / 90 — quebra o build abaixo disso |

Mais: trilha aberta uma vez funciona offline · app inteiro operável por teclado (os computadores da Nave) · todo simulador tem alternativa textual para leitor de tela · acerto e erro sinalizados por ícone **e** texto, nunca só por cor.

### 6.3. Idioma no código

Regra formal, para a mistura não virar bagunça:

| Camada                     | Idioma                     | Exemplo                                         |
| -------------------------- | -------------------------- | ----------------------------------------------- |
| Texto visível ao usuário   | **Português, sem exceção** | `"Continuar"`, `"Você acertou"`                 |
| Conteúdo e chaves do YAML  | **Português**              | `passos:`, `alternativas:`, `feedback_erro:`    |
| Tipos e modelos do domínio | **Português**              | `Trilha`, `Licao`, `Passo`, `BlocoQuiz`         |
| Rotas                      | **Português**              | `/trilha/:id/licao/:id`                         |
| Encanamento genérico       | **Inglês**                 | `useProgress`, `fetchContent`, `validateSchema` |
| Bibliotecas e ferramentas  | como vierem                | —                                               |

**Critério de decisão:** se o identificador espelha um conceito de conteúdo, é português — assim o código e o YAML usam a mesma palavra e ninguém traduz de cabeça. Se é infraestrutura, é inglês.

Sem acento e sem cedilha em identificadores (`Licao`, não `Lição`). Acento existe no conteúdo, não no código.

### 6.4. Licenças

- **Código:** GPL-3.0 (já no repositório)
- **Conteúdo:** **CC BY-SA 4.0** em `conteudo/LICENSE` — para que qualquer Nave, escola ou professor possa reusar e adaptar citando você. GPL foi desenhada para software, não para texto e exercícios.

---

## 7. Orçamento do 14-Bits

Tudo sai da rubrica de oficinas (R$1.250) e o impacto é marginal.

| Item                          | Custo       | Situação                                                                                                                                |
| ----------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Domínio `14bits.com.br`       | ~R$40/ano   | **Registrar já** — propagação e configuração levam dias                                                                                 |
| Hospedagem (Cloudflare Pages) | R$0         | Tier grátis cobre com folga                                                                                                             |
| Google Play Console           | US$25 único | **Opcional, fase 2.** Conta pessoal nova exige 12 testadores por 14 dias contínuos antes da produção — só faz sentido se decidido agora |
| Apple Developer               | —           | **Descartado**                                                                                                                          |
| **Total obrigatório**         | **~R$40**   | Sobram ~R$1.210 para coffee break, certificados e divulgação                                                                            |

Render e Railway seguem integralmente com o SALVE.

**GitHub Student Pack:** vale conferir o catálogo vigente — Copilot, GitHub Pro e créditos costumam estar lá. Não conte com nada antes de confirmar, mas o domínio `.me` gratuito da Namecheap pode servir como endereço de teste enquanto o `.com.br` não propaga.

---

## 8. Cronograma

Congelamento em **19/10**, curso na **semana de 26/10**. A semana 8 é folga real — use como folga, não como escopo extra.

| Sem. | Período       | Entrega                                                                                                                                 | Risco    |
| ---- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1    | 01–07 set     | Repositório estruturado, CI verde, design system e tokens, schema de conteúdo v1, blocos `texto`/`destaque`/`quiz`, esqueleto navegável | Baixo    |
| 2    | 08–14 set     | Motor de lição completo, blocos da Onda 2, progresso/XP/ofensiva, persistência. **Medir o tempo de criar uma lição real**               | Médio    |
| 3    | 15–21 set     | 4 primeiros simuladores, **Trilha 1 escrita e no ar**                                                                                   | Médio    |
| 4    | 22–28 set     | **Trilha 2 escrita**, PWA e offline, deploy em produção com o domínio ativo                                                             | **Alto** |
| 5    | 29 set–05 out | **Trilhas 3 e 5**, passe de acessibilidade, **teste com 3–5 pessoas do público-alvo real**                                              | **Alto** |
| 6    | 06–12 out     | Trilha 4 se couber, certificado, QR codes, polimento                                                                                    | Médio    |
| 7    | 13–19 out     | **Congelamento.** Só correção de bug. Ensaio completo da aula com o app                                                                 | —        |
| 8    | 20–25 out     | Folga. Material impresso, alinhamento com a Nave, plano B em papel                                                                      | —        |
| —    | 26/10 →       | **Oficinas.** Feedback coletado dentro do próprio app                                                                                   | —        |
| —    | novembro      | v1.1 com o feedback · Mostra Jovens Cientistas Cariocas · decidir sobre Play Store                                                      | —        |

### 8.1. Regras que salvam o cronograma

1. **Congelamento em 19/10 é inegociável.** Bug em aula ao vivo custa mais que qualquer funcionalidade a menos.
2. **Trilha 1 no ar até 21/09.** É o teste de que a pipeline de autoria funciona.
3. **Teste com gente real na semana 5** — não com colegas de engenharia, com alguém do perfil da Nave.
4. **Plano B em papel, sempre.** A aula precisa funcionar se o Wi-Fi cair.
5. **Ordem de corte se apertar:** Trilha 4 → simuladores extras → Trilha 5 → **nunca as Trilhas 1 a 3**.

### 8.2. Risco principal

Setembro e outubro já são, pelo cronograma aprovado, os meses da API Flask e do front React do SALVE. O 14-Bits é uma terceira frente.

Mitigações em vigor: stack única (React nos dois projetos), escopo pequeno (35 lições, sem backend, sem login), e a semana 8 de folga.

---

## 9. Métricas de sucesso

| Indicador                                 | Meta         | Serve para                                |
| ----------------------------------------- | ------------ | ----------------------------------------- |
| Alunos que abrem o app na oficina         | ≥ 70%        | Relatório de impacto                      |
| Lições concluídas por aluno na aula       | ≥ 3          | Validação pedagógica                      |
| Retorno ao app até 7 dias após o curso    | ≥ 25%        | Prova de legado                           |
| Lighthouse — performance / acessibilidade | ≥ 90 / 90    | Qualidade técnica                         |
| **Tempo para criar uma lição nova**       | **≤ 30 min** | **Prova de que a modularidade funcionou** |

O último é o mais importante. Se criar uma lição levar três horas, a arquitetura falhou — por mais bonito que o app esteja.

---

## 10. Fora do escopo (decisão, não esquecimento)

- Backend próprio e conta — **entrou em 15/10/2026**, ver §3.2
- Login obrigatório — a conta é e segue opcional
- Publicação em loja antes do curso — fase 2
- App Store / iOS — descartado
- Editor visual de conteúdo — fase 3; YAML e validador resolvem
- Áudio, vídeo ou 3D — peso e prazo não permitem
- Execução de código Python no navegador — o curso não aprofunda linguagem específica

---

## 11. Primeiros passos

1. **Registrar `14bits.com.br`** — fazer hoje, a propagação leva dias
2. Criar branch `setup` e abrir a estrutura de pastas da §3.3
3. `npm create vite@latest` + TypeScript + Tailwind + configuração de tokens
4. CI mínimo (lint + testes + validação de conteúdo) verde antes de qualquer feature
5. Schema de conteúdo v1 e os três primeiros blocos
6. Uma lição real de ponta a ponta — e cronometrar
