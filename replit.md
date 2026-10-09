# Caixa do Café

Aplicativo mobile de ponto de venda para cafeterias, com pedidos e estoque salvos localmente no aparelho.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/caixa-cafe/app/(tabs)/index.tsx` — caixa, cardápio e montagem de pedidos
- `artifacts/caixa-cafe/app/(tabs)/orders.tsx` — pedidos em aberto e histórico de finalizados
- `artifacts/caixa-cafe/app/(tabs)/stock.tsx` — consulta e ajuste de estoque
- `artifacts/caixa-cafe/app/(tabs)/products.tsx` — cadastro e edição do cardápio
- `artifacts/caixa-cafe/context/CafeContext.tsx` — estado e persistência local
- `artifacts/caixa-cafe/constants/colors.ts` — tema marrom para claro e escuro

## Architecture decisions

- O app é mobile-first e mantém os dados no aparelho com AsyncStorage; não depende de conexão com servidor para operar.
- Pedidos em aberto reservam itens visualmente, mas só reduzem o estoque quando são finalizados.
- O histórico mantém os nomes e preços dos itens no momento da venda, mesmo que o produto seja alterado depois.

## Product

- Montar pedidos pelo cardápio, guardar comandas em aberto e finalizar sem processar pagamento.
- Consultar histórico de pedidos finalizados.
- Cadastrar, editar e excluir produtos; ajustar estoque e ver alertas de baixo estoque.

## User preferences

- Interface em português, pensada para uso no celular, com marrons e tons de café.
- Não integrar pagamentos; finalizar o pedido é suficiente.

## Gotchas

- Finalizar um pedido aberto falha com aviso se o estoque atual não cobrir todos os itens da comanda.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
