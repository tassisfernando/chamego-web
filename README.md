# Chamego Web

Painel de gestão em português (pt-BR) para o negócio de velas artesanais Chamego.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- TanStack Query + Axios
- React Router + Lucide + Sonner

## Pré-requisito

Node.js **20+** (recomendado 22). Neste ambiente: `nvm use 22.20.0`.

## Desenvolvimento local

1. Suba a API Spring Boot em `http://localhost:8080`.
2. Neste diretório:

```bash
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:8080`, então não é necessário configurar `VITE_API_URL` no dia a dia.

CORS também está habilitado na API para `http://localhost:5173` e `http://localhost:4173`.

## Telas

- **Visão geral** — receitas, gastos, lucro/prejuízo e alertas de estoque (filtro mês/ano)
- **Vendas** — pedidos com cliente + múltiplos itens e subtotal
- **Clientes** — cadastro com aniversário/cupom
- **Velas e kits** — catálogo e estoque de produtos
- **Estoque** — insumos/materiais
- **Produção** — lotes fabricados
- **Gastos** — despesas (compras atualizam estoque quando vinculadas a insumo)
- **Ferramentas** — patrimônio

## Produção

Defina `VITE_API_URL` com a URL pública da API (Render) e faça o build:

```bash
npm run build
```
