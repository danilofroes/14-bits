# API do 14-Bits

Contas e sincronização de progresso. Mesma stack do SALVE — Flask e Postgres — de propósito: uma stack só para aprender e manter.

## A conta é opcional

O app funciona inteiro sem esta API. Quem chega pelo QR code na Nave começa a estudar em dez segundos, sem digitar nada, e o progresso fica no aparelho.

A conta existe para **um problema só**: levar o progresso de um aparelho para outro — do celular para o computador da Nave, ou para um celular novo.

Isso tem consequência de projeto: nada aqui pode bloquear o aprendizado. Se a API cair, o app continua funcionando e a sincronização tenta de novo depois.

## O que é guardado — e o que não é

| Guardado                  | Por quê                       |
| ------------------------- | ----------------------------- |
| Nome de usuário           | Identificar a pessoa na conta |
| E-mail                    | Entrar e recuperar o acesso   |
| Hash da senha (scrypt)    | Autenticar                    |
| Quais lições foram feitas | Sincronizar entre aparelhos   |

**Não guardado:**

- **As reflexões.** São texto livre que a pessoa escreve sobre a própria vida. Ficam só no aparelho dela e nunca sobem.
- **XP, ofensiva e totais.** São recalculados aqui a partir das lições concluídas (`calculos.py`). Guardar menos, e de quebra um cliente adulterado não consegue mandar 9999 de XP.
- Nada de telemetria, IP ou histórico de navegação.

O público do curso inclui adolescentes, então cada campo precisa se justificar sozinho.

## Rodando local

```bash
python -m venv api/.venv
api/.venv/Scripts/python.exe -m pip install -r api/requirements.txt
```

Sem nenhuma variável de ambiente já funciona: usa SQLite em `api/instance/` e uma SECRET_KEY fixa de desenvolvimento.

```bash
api/.venv/Scripts/python.exe -m flask --app api.aplicacao run --port 8000
```

No front, aponte para ela criando `.env.local` na raiz:

```
VITE_API_URL=http://localhost:8000
```

Sem essa variável o front roda sem contas — útil para testar o caminho de quem nunca cria conta.

## Testes

```bash
api/.venv/Scripts/python.exe -m pytest -q
```

## Rotas

| Método | Rota             | O que faz                                    |
| ------ | ---------------- | -------------------------------------------- |
| POST   | `/api/conta`     | Cria conta e já abre a sessão                |
| POST   | `/api/sessao`    | Entra (aceita e-mail **ou** nome de usuário) |
| DELETE | `/api/sessao`    | Sai                                          |
| GET    | `/api/eu`        | Quem está logado (200 com `null` se ninguém) |
| GET    | `/api/progresso` | Progresso da conta                           |
| PUT    | `/api/progresso` | Mescla o progresso do aparelho e devolve     |
| GET    | `/api/saude`     | Para o monitoramento do Render               |

`PUT /api/progresso` **mescla, não substitui**: quem estudou no celular e depois entrou no computador da Nave não pode perder o que fez. Em conflito fica o maior XP e a data mais antiga.

## Decisões de segurança

- **Senha com scrypt** (padrão do Werkzeug 3). A senha nunca é guardada nem devolvida.
- **Sessão em cookie httpOnly**, não em `localStorage`. O token nunca passa pelo JavaScript, então XSS não o rouba.
- **Mesma mensagem** para senha errada e conta inexistente — mensagens diferentes revelariam quais e-mails têm conta. O caminho da conta inexistente ainda gasta o tempo de um hash, para o relógio não denunciar.
- **Limite de tentativas** no login e no cadastro (`extensoes.py`).
- **CORS com origem explícita** e `supports_credentials`. Sem isso o cookie não atravessa.

## Implantação

**Banco no Railway, API no Render** — a divisão já prevista no orçamento do edital.

1. No Railway, crie um Postgres e copie a `DATABASE_URL`.
2. No Render, crie um Web Service a partir deste repositório usando `api/Dockerfile`.
3. Configure as variáveis (ver `.env.exemplo`):

```
SECRET_KEY=<python -c "import secrets; print(secrets.token_urlsafe(48))">
DATABASE_URL=<a do Railway>
AMBIENTE=producao
ORIGENS_PERMITIDAS=https://14bits.com.br
COOKIE_SEGURO=1
COOKIE_SAMESITE=Lax
COOKIE_DOMINIO=.14bits.com.br
```

> **Sobre o cookie:** com a API num subdomínio do site (`api.14bits.com.br` falando com `14bits.com.br`), `SameSite=Lax` basta e é a opção mais segura. Se o front ficar em outro domínio — Cloudflare Pages, por exemplo — são necessários `COOKIE_SAMESITE=None` e `COOKIE_SEGURO=1`. Prefira o subdomínio.

O `Dockerfile` sobe com **um worker só**, porque o limitador de tentativas guarda estado em memória. Para escalar, aponte `RATELIMIT_STORAGE_URI` para um Redis antes de aumentar os workers.

## Ainda falta

- **Recuperação de senha.** Hoje quem esquece a senha perde o acesso à conta (não o progresso do aparelho). Precisa de envio de e-mail.
- **Migrações.** As tabelas são criadas com `create_all()`. Na primeira mudança de schema em produção, entra Alembic.
- **Apagar a conta.** A LGPD dá esse direito, e hoje só dá para fazer no banco.
