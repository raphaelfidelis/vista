# vista-api

API do Vista. NestJS + TypeORM + Postgres.

## Rodando

Requer Postgres acessível e um `.env` criado a partir do `.env.example`.

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

## Organização de um módulo

```
NomeDoModulo/
  NomeDoModulo.module.ts
  Controllers/    controllers HTTP
  Domain/         entidade + interfaces (Queries, Repositories)
  Infra/          implementações (Models, Mappers, Queries, Repositories)
```

O controller chama uma *query*, nunca um repositório diretamente. As interfaces em `Domain/` são ligadas às implementações em `Infra/` por tokens de DI declarados no módulo.

Entidades (`*.model.ts`) e migrations são descobertas por glob — um módulo novo não exige alterar a configuração do TypeORM.
