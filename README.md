# BI Dashboard Platform

## Visao geral

Dashboard analitico standalone em React 18 + Vite 6, com tema claro/escuro, filtros combinaveis, cross-filter entre graficos e camada local de dados mockados mantendo contrato proximo ao de uma API REST.

O projeto esta estruturado para separar:

- contrato e simulacao de dados;
- derivacao analitica por dominio;
- estado e filtros por aba;
- layout compartilhado;
- componentes reutilizaveis de chart, KPI e tabela.

## Estado atual

Abas disponiveis:

- `Visao Geral`
- `Produtos`
- `Clientes`
- `Fornecedores`
- `Cotacoes`
- `Pedidos & Logistica`

Recursos implementados:

- filtros por dominio com cross-filter;
- KPIs, rankings, mapas e series temporais;
- tabela operacional com exportacao para XLSX e PDF;
- tema claro/escuro com persistencia;
- charts reutilizaveis baseados em ECharts;
- mocks locais no mesmo formato esperado por uma camada REST.

## Otimizacoes de desempenho aplicadas

O estado atual ja incorpora as seguintes otimizações seguras:

- lazy loading por aba com `React.lazy` + `Suspense`;
- prefetch ocioso das abas via `requestIdleCallback` e prefetch em `hover/focus`;
- troca de abas com `startTransition` para reduzir bloqueio de interacao;
- `ErrorBoundary` por aba e por secao critica;
- exportacao da tabela com `xlsx`, `jspdf` e `jspdf-autotable` carregados sob demanda;
- busca da tabela usando `useDeferredValue` para digitação mais fluida;
- montagem tardia de conteudo pesado em modais, evitando render desnecessario fora da tela;
- charts principais com `lazyUpdate` e renderer `canvas`.

Impacto observado no build:

- o chunk principal do modulo caiu de aproximadamente `2.2 MB` para `1.5 MB` minificado;
- `xlsx` e `jspdf` deixaram de contaminar o bundle inicial e passaram a ser carregados apenas no fluxo de exportacao.

## Limites atuais

Os dois maiores pontos ainda restantes sao:

- `brasil.geo.json`, que continua gerando um asset muito grande;
- `dashboardSelectors`, que ainda concentra bastante logica analitica em um chunk grande.

Esses pontos nao foram reestruturados agora para evitar risco de regressao visual ou funcional.

## Stack

| Categoria | Tecnologias |
|---|---|
| Runtime | React 18, React DOM 18 |
| Build | Vite 6 |
| UI | React Bootstrap, Bootstrap 5 |
| Charts | ECharts, echarts-for-react |
| Exportacao | xlsx, jspdf, jspdf-autotable |
| Datas | react-datepicker, date-fns |
| i18n | i18next, react-i18next |
| Estilos | CSS por feature + SCSS localizado |

## Como rodar

Requisitos:

- Node.js 18+
- npm

Instalacao:

```bash
npm install
```

Desenvolvimento:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

## Arquitetura

```mermaid
flowchart LR
    A["Mocks JSON / GeoJSON"] --> B["src/services/rest.js"]
    B --> C["tabs/*.state.js"]
    C --> D["selectors de dominio"]
    D --> E["tabs/*.jsx"]
    E --> F["DashboardTabLayout"]
    F --> G["KPIs / Charts / Tabela"]
```

Camadas principais:

- `src/services`: simulacao de backend, filtros e responses;
- `src/dashboard/selectors`: derivacao analitica por dominio;
- `src/dashboard/tabs/*/*.state.js`: orquestracao e estado por aba;
- `src/dashboard/components`: layout compartilhado das abas;
- `src/dashboard/components/shared`: charts, tabela, KPI card e boundary reutilizavel.

## Estrutura principal

```text
src/
├─ App.jsx
├─ main.jsx
├─ services/
│  └─ rest.js
├─ mocks/dashboard/
├─ dashboard/
│  ├─ index.jsx
│  ├─ hooks/
│  ├─ selectors/
│  ├─ components/
│  └─ tabs/
└─ styles/
```

## Contrato de dados

As responses do frontend seguem o formato:

- `fact`: base analitica;
- `table`: base operacional;
- `kpis`: indicadores agregados;
- `alertas`: estruturas auxiliares de exibicao.

Campos frequentes:

- `client_id`, `client_name`
- `supplier_id`, `supplier_name`
- `product_id`, `product_name`
- `product_class_material_name`
- `client_state`
- `order_date`
- `year_months`
- `purchase_order_id`
- `quotation_code`
- `quantity_requested`, `sum_quantity`
- `unit_price`, `avg_unit_price`
- `total_amount`, `sum_total_amount`
- `item_status`, `order_status`, `quotation_status`, `logistics_status`
- `abc_classification`, `xyz_classification`

## Observacao sobre hidratacao

Este projeto hoje e uma SPA client-side pura em Vite, sem SSR. Portanto, nao existe hidratacao de servidor para otimizar. As tecnicas aplicadas foram as equivalentes e corretas para esse contexto: code splitting, prefetch ocioso, transicoes, fallback de erro e adiamento de montagem/carga.
