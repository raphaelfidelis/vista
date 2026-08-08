# Vista

Dashboard pessoal — clima, economia doméstica, notícias, onde assistir filmes e controle de gastos.

Monorepo simples: uma pasta por projeto, cada um com seu próprio `package.json`, build e dependências. Não há ferramenta de orquestração — os projetos são executados individualmente.

## Estrutura

```
vista-api/    API NestJS + TypeORM + Postgres
vista-web/    Frontend Next.js
```

## Requisitos

- Node.js 22+
- Postgres rodando em `localhost:5432` com um banco `vista`

## vista-api

```bash
cd vista-api
npm install
```

Crie um `.env` a partir do `.env.example` e ajuste as credenciais.

Rode as migrations:

```bash
npm run migration:run
```

Suba em modo desenvolvimento:

```bash
npm run start:dev
```

### Módulos

| Módulo  | Endpoint    | Descrição                              |
| ------- | ----------- | -------------------------------------- |
| Feature | `GET /features` | Funcionalidades ativas do dashboard |

### Organização de um módulo

```
Feature/
  Feature.module.ts
  Controllers/      controllers HTTP
  Domain/           entidade + interfaces (Queries, Repositories)
  Infra/            implementações (Models, Mappers, Queries, Repositories)
```

O controller chama uma *query*, nunca um repositório diretamente. As interfaces em `Domain/` são ligadas às implementações em `Infra/` por tokens de DI declarados no módulo.

## vista-web

Ainda não iniciado.
