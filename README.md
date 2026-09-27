# Vista

Dashboard pessoal — clima, economia doméstica, notícias, onde assistir filmes e controle de gastos.

Monorepo simples: uma pasta por projeto, cada um com seu próprio `package.json`, build e dependências. Não há ferramenta de orquestração — cada projeto roda a partir da sua pasta.

## Estrutura

| Projeto | Stack | Porta |
| --- | --- | --- |
| [`vista-api`](vista-api/) | NestJS, TypeORM, Postgres | 3000 |
| [`vista-web`](vista-web/) | Next.js, Tailwind | 3001 |

## Requisitos

- Node.js 22+
- Postgres com um banco `vista`, para o `vista-api`

## Rodando

Cada projeto em um terminal. Instruções detalhadas nos READMEs de cada um.

```bash
cd vista-api
npm install
npm run start:dev
```

```bash
cd vista-web
npm install
npm run dev
```

## Status

O shell do frontend (menu lateral, top bar, tema) está pronto, com um módulo de exemplo. A API tem a conexão com o banco configurada e ainda nenhum módulo — o primeiro entra junto com o primeiro módulo de conteúdo.
