# vista-web

Frontend do Vista. Next.js (App Router) + Tailwind.

## Rodando

Crie o `.env.local` a partir do `.env.local.example`: `API_URL` (onde está o `vista-api`) e `INTERNAL_API_KEY` (a mesma do `.env` da API). As duas ficam só no servidor: o navegador nunca fala com a API.

```bash
npm install
npm run dev
```

Sobe em [http://localhost:3001](http://localhost:3001) — a porta 3000 é do `vista-api`.

## Scripts

| Script | Uso |
| --- | --- |
| `dev` | Servidor de desenvolvimento |
| `build` / `start` | Build e servidor de produção |
| `lint` | ESLint com correção automática |
| `format` | Prettier |

## Estrutura

```
src/
  app/
    layout.tsx          fontes e estilos globais
    (auth)/             entrar e criar conta (sem sessão)
    (shell)/            moldura: menu lateral + top bar + slot do módulo
      layout.tsx
      <modulo>/page.tsx uma pasta por módulo
      minha-conta/      nome, senha e sair
  proxy.ts              sem cookie de sessão → /entrar; CSP com nonce por requisição
  components/           Nav, TopBar, ThemeSwitcher, AccentProvider
  lib/
    modules.ts          registro dos módulos exibidos no menu
    accents.ts          cores de acento disponíveis
    icons.ts            fonte de ícones (subset gerado a partir dos módulos)
    preferences*.ts     leitura e escrita dos cookies de preferência
    api.server.ts       chamadas à API com a chave interna e o token (401 → /entrar)
    session.server.ts   cookie httpOnly com o token da sessão
```

## Celular e busca

- Abaixo de 768 px o menu lateral dá lugar à barra inferior (`components/BottomBar.tsx`): GERAL, LANÇAMENTOS, **+** (abre o novo lançamento de qualquer tela, via `/lancamentos?novo=1`), CARTÕES e MAIS. Os formulários abrem em tela cheia.
- Tabela ou cartões depende da largura do conteúdo, não da tela: o conteúdo é um `@container` e as listas usam `@2xl:table` / `@2xl:hidden`. Assim nada estoura com o menu lateral aberto em telas médias.
- `/lancamentos/busca`: texto (sem diferenciar maiúsculas nem acentos), período, tipo, categoria e conta/cartão, com os filtros na URL e CARREGAR MAIS. Compra no cartão conta pelo mês da fatura, como no relatório.
- Na lista do mês e na busca, dá para marcar vários lançamentos e MUDAR CATEGORIA de uma vez (`components/TransactionList.tsx` + `RecategorizeBar.tsx`).

## Adicionando um módulo

1. Crie `src/app/(shell)/<modulo>/page.tsx`
2. Registre em `src/lib/modules.ts` com nome, descrição, ícone e rota

O ícone é o nome de uma ligadura do [Material Symbols Outlined](https://fonts.google.com/icons). O subset da fonte é recalculado a partir do registro.

## Design

Tokens (cores, tipografia, larguras) ficam em `src/app/globals.css`, no bloco `@theme`. Cor de acento e estado do menu são persistidos em cookie e lidos no servidor, então a primeira pintura já sai com as preferências do usuário.
