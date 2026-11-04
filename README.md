# Resenha Secreta — Quem é Quem no Grupo?

Jogo social de votação secreta para grupos de amigos, família ou trabalho. O organizador cria uma resenha, escolhe categorias como **CEO da Enrolação** e **Fantasma do WhatsApp**, compartilha o convite e todos votam em uma pessoa por categoria — menos em si mesmos. O placar só aparece quando o organizador libera os resultados.

- **Frontend:** React 19 + TypeScript (strict) + Vite.
- **Backend:** Supabase (PostgreSQL) acessado apenas por RPCs `security definer`; as tabelas têm RLS e não aceitam acesso direto.
- **Hospedagem:** qualquer host estático, com configuração pronta para GitHub Pages.
- **Sem cadastro:** cada participante entra com um apelido e recebe um token aleatório de sessão.

> Os votos individuais nunca são retornados pela API. O organizador vê apenas o progresso (quantas categorias cada pessoa respondeu), nunca em quem cada uma votou. Os resultados são agregados e só ficam disponíveis após a revelação.

---

## Índice

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração do Supabase](#configuração-do-supabase)
- [Migrações e RLS](#migrações-e-rls)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Execução local](#execução-local)
- [Testes e verificações](#testes-e-verificações)
- [Build de produção](#build-de-produção)
- [Publicação no GitHub Pages](#publicação-no-github-pages)
- [Modo demonstração](#modo-demonstração)
- [Limitações e dependências externas](#limitações-e-dependências-externas)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Estrutura do projeto](#estrutura-do-projeto)

---

## Requisitos

- **Node.js 20 ou superior** (o CI usa Node 22).
- **npm 10 ou superior**.
- Conta no [Supabase](https://supabase.com) para o modo compartilhado entre dispositivos.
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) e/ou `psql` para aplicar migrações e rodar os testes de banco.

## Instalação

```bash
git clone https://github.com/SEU-USUARIO/resenha.git
cd resenha
npm install
```

## Configuração do Supabase

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Abra **SQL Editor** e execute o conteúdo de
   [`supabase/migrations/20261026000000_init.sql`](supabase/migrations/20261026000000_init.sql).
   Alternativamente, com a CLI:

   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   supabase db push
   ```

3. Copie a **Project URL** e a chave **anon/publishable** em
   **Project Settings → API**. Elas são públicas e vão para o frontend.
4. **Nunca** use a chave `service_role` no frontend, em variáveis `VITE_*`, no repositório ou no GitHub Pages. Ela ignora RLS e daria acesso total ao banco.

A migração cria:

- `rooms`, `participants`, `categories`, `room_categories` e `votes`.
- Índices, restrições de unicidade e triggers de integridade.
- RPCs para criar sala, entrar, consultar sessão, editar sala, abrir/encerrar votação, revelar, arquivar, excluir, votar e consultar resultados.
- Tokens de participantes armazenados apenas como hash SHA-256.
- Bloqueio de voto duplicado, auto-voto, voto fora da categoria/sala e entrada após encerramento.

## Migrações e RLS

As migrações ficam em `supabase/migrations/` e são versionadas. Para aplicar em um banco já existente, rode apenas as migrações pendentes:

```bash
supabase db push
```

Para recriar um ambiente local do zero:

```bash
supabase start
supabase db reset
```

### Como a RLS é configurada

- RLS está **habilitada** em todas as tabelas.
- Nenhuma política de `SELECT`, `INSERT`, `UPDATE` ou `DELETE` é concedida para `anon`/`authenticated`.
- `revoke all` remove o acesso direto das tabelas e de todas as funções internas.
- Apenas as RPCs públicas recebem `grant execute` para `anon` e `authenticated`.
- As RPCs são `security definer` com `search_path = public, extensions` e validam o token de sessão, o status da sala e as regras de voto no servidor.
- `get_results` exige token de participante; `get_public_results` funciona apenas por código e somente depois da revelação.

### Teste de fumaça do banco

O arquivo [`supabase/tests/smoke.sql`](supabase/tests/smoke.sql) cobre o ciclo completo, permissões, auto-voto, voto duplicado, bloqueio antes da revelação, empates, resultados públicos, negação de acesso direto às tabelas e códigos de acesso.

Exemplo com um PostgreSQL local (a migração já aplicada):

```bash
psql -h /tmp -p 55432 -U postgres -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql
```

## Variáveis de ambiente

Copie o exemplo e preencha apenas com dados públicos:

```bash
cp .env.example .env.local
```

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA

# Opcional: caminho base do build. O padrão é /resenha/.
# VITE_BASE_PATH=/
```

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Para modo compartilhado | URL do projeto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Para modo compartilhado | Chave pública `anon`/publishable. |
| `VITE_BASE_PATH` | Não | Caminho base do build. Padrão: `/resenha/`. Use `/` para domínio próprio na raiz. |

Sem as duas variáveis do Supabase, a aplicação inicia em **modo demonstração local** (veja abaixo).

## Execução local

```bash
npm run dev
```

O Vite abre a aplicação em `http://localhost:5173/`.

## Testes e verificações

```bash
npm run test        # Vitest + React Testing Library
npm run test:watch  # modo interativo
npm run lint        # ESLint
npm run typecheck   # TypeScript strict
npm run build       # typecheck + build + geração do 404.html
```

Os testes cobrem validação, cálculo de resultados e empates, geração do card SVG, fluxo completo do repositório local (entrada, votos, revelação, arquivamento, exclusão, códigos de acesso) e páginas com React Testing Library.

## Build de produção

```bash
npm run build
npm run preview
```

O build gera `dist/`. O script `scripts/generate-404.mjs` cria `dist/404.html`, que restaura rotas profundas no GitHub Pages (por exemplo, recarregar `/resenha/ABC123/resultado`).

O `base` do Vite vem de `VITE_BASE_PATH`:

```bash
# GitHub Pages em https://usuario.github.io/resenha/
VITE_BASE_PATH=/resenha/ npm run build

# Domínio próprio na raiz
VITE_BASE_PATH=/ npm run build
```

## Publicação no GitHub Pages

O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) roda lint, typecheck, testes e build a cada push na branch `main`, e publica `dist/` no GitHub Pages.

1. Crie o repositório no GitHub e envie o projeto:

   ```bash
   git init
   git add .
   git commit -m "feat: Resenha Secreta"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/resenha.git
   git push -u origin main
   ```

2. No GitHub, abra **Settings → Pages** e escolha **Source: GitHub Actions**.
3. Em **Settings → Secrets and variables → Actions → Variables**, cadastre (opcional, para o modo compartilhado):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Se o repositório não se chamar `resenha` ou se você usar domínio próprio, cadastre também a variable `VITE_BASE_PATH`:
   - repositório `meu-repo` → `/meu-repo/`
   - repositório de usuário `usuario.github.io` → `/`
   - domínio próprio na raiz → `/`
5. Faça push na `main` e acompanhe em **Actions**. O workflow usa Node 22 e `npm ci`.

Sem as variables do Supabase, o site publicado funciona apenas em modo demonstração local (os dados ficam no navegador de cada pessoa).

### Domínio próprio

- Configure o domínio em **Settings → Pages → Custom domain**.
- Crie `public/CNAME` com o domínio.
- Gere o build com `VITE_BASE_PATH=/`.
- Ajuste o DNS conforme a documentação do GitHub Pages.

## Modo demonstração

Quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` não estão configuradas, a aplicação usa `DemoRepository`, que persiste tudo em `localStorage` e sincroniza abas do mesmo navegador via `CustomEvent`.

Características e limites:

- **Não compartilha dados entre dispositivos.** Não serve para o uso real com o grupo.
- A interface deixa claro que o modo é local/demonstração.
- Nenhum resultado fictício é apresentado como real: os resultados vêm apenas dos votos registrados naquela sessão local.
- As mesmas regras de negócio são aplicadas no cliente (auto-voto, voto duplicado, revelação, empate).

Para o jogo real, configure o Supabase.

## Limitações e dependências externas

- **Supabase free tier:** limites de banco, banda, requisições e projetos pausados por inatividade. Verifique os limites atuais antes de um evento grande.
- **GitHub Pages:** hospedagem estática gratuita, sem backend próprio; o Supabase é o backend. Repositórios públicos são necessários no plano gratuito.
- **Google Fonts:** as fontes são carregadas do Google; se houver bloqueio de rede, o app usa as fontes de fallback.
- **Web Share API:** disponível principalmente em navegadores móveis e em contexto seguro (HTTPS). Quando indisponível, o app oferece download do PNG, cópia de texto e WhatsApp.
- **WhatsApp:** o compartilhamento abre `wa.me` com texto pronto; o envio depende do aplicativo do usuário.
- **Votos e dados:** não há contas nem e-mail. Quem perder o token salvo no navegador perde acesso à sessão de participante; o organizador também não consegue recuperar votos individuais (por design).

## Segurança e privacidade

- Nunca exponha `service_role`, senhas do banco ou chaves secretas no frontend.
- Mantenha a RLS habilitada e não crie políticas de acesso direto às tabelas.
- Use HTTPS (GitHub Pages já fornece).
- Tokens de sessão são aleatórios, ficam somente no `localStorage` do participante e são armazenados no banco como hash SHA-256.
- A API não devolve votos individuais; nem o organizador vê em quem cada pessoa votou.
- Códigos de acesso de salas são validados no servidor.
- Limite o compartilhamento do link/código ao grupo desejado.
- Não colete dados pessoais: use apelidos e evite informações sensíveis nas categorias.
- Para excluir uma sala, o organizador pode arquivá-la ou removê-la; a remoção apaga os dados associados.
- Se o token vazar, outra pessoa pode agir como aquele participante. Não compartilhe o token nem o conteúdo do `localStorage`.

## Estrutura do projeto

```text
.
├── .github/workflows/deploy.yml   # CI + GitHub Pages
├── public/                        # favicon e arquivos estáticos
├── scripts/generate-404.mjs       # fallback de SPA para o Pages
├── src/
│   ├── components/                # primitives e feedbacks reutilizáveis
│   ├── features/
│   │   ├── results/               # cálculo de placar e card PNG
│   │   ├── rooms/                 # criação, convite e controles
│   │   └── sharing/               # URLs, cópia e WhatsApp
│   ├── hooks/                     # sessão, polling, título etc.
│   ├── lib/                       # validação, categorias, erros, sessão
│   ├── pages/                     # rotas da aplicação
│   ├── services/                  # Supabase e demo
│   ├── styles/                    # tokens, páginas e jogo
│   └── types/                     # contratos TypeScript
├── supabase/
│   ├── migrations/                # migração versionada
│   └── tests/smoke.sql            # testes de banco/RLS
├── tests/                         # Vitest + Testing Library
├── .env.example
└── vite.config.ts
```

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Landing page. |
| `/criar` | Criação da resenha e das categorias. |
| `/entrar` | Entrada por código de 6 caracteres. |
| `/resenha/:codigo` | Sala, convite e controles do organizador. |
| `/resenha/:codigo/votar` | Votação secreta por categoria. |
| `/resenha/:codigo/resultado` | Placar público após a revelação. |
| `/privacidade` | Regras de convivência e privacidade. |
| `*` | Página 404. |
