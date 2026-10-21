# vista-api

API do Vista. NestJS + TypeORM + Postgres.

## Rodando

Requer Postgres acessível e um `.env` criado a partir do `.env.example`, com:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | conexão com o Postgres |
| `PORT` / `HOST` | onde a API escuta (mantenha `127.0.0.1`) |
| `INTERNAL_API_KEY` | obrigatória, 32+ caracteres; a mesma do `.env.local` do `vista-web`. Sem ela a API não sobe, e quem chama sem ela recebe 404 |
| `INVITE_CODE` | código pedido em *Criar conta*; vazio ou com menos de 12 caracteres fecha o cadastro |

```bash
npm install
npm run migration:run
npm run start:dev
```

## Scripts

| Script | Uso |
| --- | --- |
| `start:dev` | Servidor em modo watch |
| `build` | Compila para `dist/` |
| `lint` | ESLint com correção automática |
| `test` | Testes unitários (Jest) |
| `migration:generate -- src/database/migrations/Nome` | Gera migration a partir das entidades |
| `migration:run` / `migration:revert` | Aplica / desfaz migrations |
| `user:reset-password -- <email>` | Gera uma senha temporária para a conta (não há "esqueci a senha" por e-mail) e encerra as sessões dela |

## Organização de um módulo

```
NomeDoModulo/
  NomeDoModulo.module.ts
  Controllers/    controllers HTTP
  Domain/         entidade + interfaces (Queries, Repositories)
  Infra/          implementações (Models, Mappers, Queries, Repositories)
```

Módulos: `Auth` (contas, sessões, guard global, chave interna) e `Finance`.

Toda rota exige sessão (`Authorization: Bearer`), menos as marcadas com `@Public()`. Os controllers recebem o dono por `@CurrentUserId()` e o repassam até os repositórios, que filtram toda consulta por ele.

Conta nova nasce com categorias padrão (`Finance/Domain/DefaultCategories.ts`): o cadastro chama o gancho `ACCOUNT_SETUP` do Auth, que o Finance implementa. A migration `AddDefaultCategories` deu a mesma lista às contas antigas sem categoria.

Lançamentos, além do CRUD: `GET /transactions/search` (`text`, `from`/`to` AAAA-MM, até 36 meses, `kind`, `categoryId`, `originId`, `offset`, `limit` de 1 a 100; devolve `total` e as somas de todos os resultados) e `PATCH /transactions/category { ids, categoryId }` (até 200, tudo ou nada; parcela muda a compra inteira).

O controller chama uma *query*, nunca um repositório diretamente. As interfaces em `Domain/` são ligadas às implementações em `Infra/` por tokens de DI declarados no módulo.

Entidades (`*.model.ts`) e migrations são descobertas por glob — um módulo novo não exige alterar a configuração do TypeORM.
