# Vista

App pessoal de finanças: contas e saldos, cartões com fatura e parcelas, receitas e despesas, gastos fixos, orçamento, metas, fluxo de caixa e alertas. Cada pessoa entra com a própria conta e vê só os próprios dados.

Monorepo simples: uma pasta por projeto, cada um com seu próprio `package.json`, build e dependências. Não há ferramenta de orquestração; cada projeto roda a partir da sua pasta.

## Estrutura

| Projeto | Stack | Porta |
| --- | --- | --- |
| [`vista-api`](vista-api/) | NestJS, TypeORM, Postgres | 3000 |
| [`vista-web`](vista-web/) | Next.js, Tailwind | 3001 |

O navegador só fala com o `vista-web`. O servidor do Next chama a API com uma chave interna (`INTERNAL_API_KEY`, a mesma nos dois `.env`) e com o token da sessão, que fica num cookie que o JavaScript do navegador não lê.

## Requisitos

- Node.js 22+
- Postgres com um banco `vista`, para o `vista-api`

## Rodando

1. Crie os `.env` a partir dos exemplos: `vista-api/.env.example` e `vista-web/.env.local.example`. Gere a `INTERNAL_API_KEY` (a mesma nos dois) e um `INVITE_CODE` com:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Suba cada projeto em um terminal (detalhes nos READMEs de cada um):

   ```bash
   cd vista-api
   npm install
   npm run migration:run
   npm run start:dev
   ```

   ```bash
   cd vista-web
   npm install
   npm run dev
   ```

3. Abra [http://localhost:3001/criar-conta](http://localhost:3001/criar-conta) e crie a conta com o `INVITE_CODE`.

## Status

- **Contas de usuário**: cadastro só com código de convite, login por e-mail e senha, troca de nome e senha em *Minha conta*. Não há envio de e-mail: senha esquecida se redefine pelo terminal (`npm run user:reset-password -- <email>` no `vista-api`). O login com Google foi planejado, mas ficou para depois.
- **Finanças**: visão geral (alertas, faturas, orçamento, metas, fluxo de caixa), lançamentos (com exportação `.xlsx`), cartões, contas, orçamento e metas.

## Segurança

- Todo dado financeiro pertence a um usuário, e toda consulta da API filtra por ele: o id de outra pessoa responde como inexistente.
- A API exige a chave interna antes de qualquer rota (sem ela, 404 para tudo) e escuta só em `127.0.0.1`. O `next dev` também.
- Senhas com argon2id; sessão de 30 dias, que acaba antes com 7 dias sem uso; limite de tentativas de senha e de convite.
- O web manda CSP com nonce e os cabeçalhos de segurança usuais.

**Limites conhecidos:** o app roda local, sem HTTPS. Para hospedar, é preciso HTTPS, cookie `Secure` (já ligado em produção) e rever o `HOST` da API. O limite de tentativas fica em memória e zera quando a API reinicia. Quem tem acesso aos arquivos da máquina lê os `.env`.
