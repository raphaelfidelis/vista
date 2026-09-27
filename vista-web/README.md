# vista-web

Frontend do Vista. Next.js (App Router) + Tailwind.

## Rodando

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
    (shell)/            moldura: menu lateral + top bar + slot do módulo
      layout.tsx
      <modulo>/page.tsx uma pasta por módulo
  components/           Nav, TopBar, ThemeSwitcher, AccentProvider
  lib/
    modules.ts          registro dos módulos exibidos no menu
    accents.ts          cores de acento disponíveis
    icons.ts            fonte de ícones (subset gerado a partir dos módulos)
    preferences*.ts     leitura e escrita dos cookies de preferência
```

## Adicionando um módulo

1. Crie `src/app/(shell)/<modulo>/page.tsx`
2. Registre em `src/lib/modules.ts` com nome, descrição, ícone e rota

O ícone é o nome de uma ligadura do [Material Symbols Outlined](https://fonts.google.com/icons). O subset da fonte é recalculado a partir do registro.

## Design

Tokens (cores, tipografia, larguras) ficam em `src/app/globals.css`, no bloco `@theme`. Cor de acento e estado do menu são persistidos em cookie e lidos no servidor, então a primeira pintura já sai com as preferências do usuário.
