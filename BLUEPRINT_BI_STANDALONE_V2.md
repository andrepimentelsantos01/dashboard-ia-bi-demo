# Blueprint BI Standalone v2 - Versao Final

## Objetivo

Este blueprint oficializa o estado final do projeto e o padrao de manutencao para o portfolio de BI standalone.

Ele passa a considerar apenas os quatro dominios ativos:

- Adidas
- Amazon
- Restaurant
- Logistics

Abas descontinuadas nao fazem mais parte do escopo, da navegacao nem da camada de dados.

## Principios obrigatorios

1. UI nao conhece parsing bruto de dataset.
2. Cada aba consome apenas view model pronto do seu state hook.
3. Regras analiticas ficam em selectors puros por dominio.
4. Contrato de dados interno deve permanecer estavel entre datasets.
5. Cross-filter e traducao de filtros devem ser padronizados em helpers compartilhados.
6. Otimizacoes de bundle e lazy loading sao parte da arquitetura, nao pos-processo.
7. Datasets, assets geograficos e exportadores pesados devem ficar sob demanda quando nao forem necessarios no caminho inicial.

## Arquitetura oficial

Fluxo adotado no repositorio:

`dataset real local -> services/rest.js -> state hook da aba -> selectors do dominio -> tab -> shell compartilhado`

### Responsabilidades

- `src/services/rest.js`
  - carrega datasets reais locais sob demanda;
  - normaliza cada dominio para o contrato interno comum;
  - mantem cache em memoria por dominio depois do primeiro carregamento;
  - aplica filtros de consulta consumidos pelas abas.

- `src/dashboard/tabs/*/*.state.js`
  - mantem estado de UI da aba;
  - traduz filtros do shell para payload da camada de dados;
  - orquestra servico, selectors e cross-filter.

- `src/dashboard/selectors/*.js`
  - calculam KPIs, rankings, series, heatmaps, gauges e tabela operacional;
  - devem permanecer puros e previsiveis.

- `src/dashboard/components/`
  - renderizam layout, secoes, cards, charts, tabela e modal de data;
  - nao devem incorporar regra analitica de dominio.

- `src/dashboard/config/tabs.config.js`
  - fonte unica de verdade para navegacao, preload e schema visual das abas finais.

- `src/hooks/useThemeMode.js`
  - fonte compartilhada do tema claro/escuro;
  - sincroniza DOM, `localStorage` e multiplas instancias do hook.

## Estrutura final real

```text
src/
|-- App.jsx
|-- main.jsx
|-- core/
|   |-- auth.js
|-- hooks/
|   |-- useThemeMode.js
|-- services/
|   |-- rest.js
|-- mocks/
|   |-- datasetReal/
|   |-- dashboard/
|-- dashboard/
|   |-- config/
|   |   |-- tabs.config.js
|   |-- components/
|   |-- hooks/
|   |   |-- dashboardTabState.helpers.js
|   |   |-- useDashboardTabUi.js
|   |   |-- useFilterSectionOptions.js
|   |   |-- useFormatter.js
|   |-- selectors/
|   |   |-- tab1Selectors.js
|   |   |-- amazonSalesSelectors.js
|   |   |-- restaurantSalesSelectors.js
|   |   |-- logisticsPerformanceSelectors.js
|   |   |-- shared/
|   |-- tabs/
|   |   |-- shared/
|   |   |-- Tab1/
|   |   |-- Tab2/
|   |   |-- Tab3/
|   |   |-- Tab4/
|   |-- index.jsx
|   |-- index.css
tests/
|-- run.js
```

## Contrato interno de dados

Toda aba deve operar sobre um shape normalizado compativel com o contrato abaixo:

```js
{
  row_id: 1,
  client_id: "...",
  client_name: "...",
  supplier_id: "...",
  supplier_name: "...",
  product_id: "...",
  product_name: "...",
  product_class_material_name: "...",
  client_state: "...",
  order_date: "2025-01-10T00:00:00.000Z",
  year_months: "2025-01",
  purchase_order_id: "...",
  quantity_requested: 100,
  sum_quantity_requested: 100,
  sum_quantity: 100,
  total_amount: 5000,
  sum_total_amount: 5000,
  avg_unit_price: 50,
  unit_price: 50,
  item_status: "Entregue",
  logistics_status: "Entregue",
  quotation_status: "delivered"
}
```

### Regra

Componentes visuais nao devem depender de campos crus do dataset se o contrato normalizado ja atender o caso.

## Dominios ativos

### Adidas

- origem: `adidasUsSales.json`
- especialidades: `operating_profit`, `operating_margin`, `region`, `sales_method`
- selector: `tab1Selectors.js`
- aba: `Tab1`
- schema visual: `adidas`

### Amazon

- origem: `Amazon Sales 2025 Dataset.csv`
- especialidades: `customer_name`, `customer_location`, `payment_method`
- selector: `amazonSalesSelectors.js`
- aba: `Tab2`
- schema visual: `amazon`

### Restaurant

- origem: `Restaurant Sales Dataset.csv`
- especialidades: `time_of_sale`, `received_by`, `transaction_type`
- selector: `restaurantSalesSelectors.js`
- aba: `Tab3`
- schema visual: `restaurant`

### Logistics

- origem: `Logistics Shipments Dataset.csv`
- especialidades: `origin_warehouse`, `destination`, `carrier`, `delay_days`, `on_time_flag`
- selector: `logisticsPerformanceSelectors.js`
- aba: `Tab4`
- schema visual: `logistics`

## Padrao de filtros

Shape base compartilhado:

```js
export const initialFilters = {
  dateRange: null,
  suppliers: [],
  clients: [],
  categorias: [],
  produtos: [],
  orders: [],
  status: [],
  mes: null,
  uf: null
};
```

### Regras

- cada aba pode estender o shape com filtros especificos do dominio;
- traducao para payload de consulta deve passar por `buildDashboardApiFilters`;
- cross-filter deve usar helpers compartilhados antes de criar logica customizada;
- mapeamentos customizados devem ficar no `*.state.js` da aba, nunca no JSX.

## Padrao dos state hooks

Todo `*.state.js` deve:

1. montar `initialFilters` da aba;
2. gerar `apiFilters` via helper compartilhado;
3. buscar dados via `rest.js`;
4. memoizar analytics, tabela e view model;
5. expor handlers previsiveis de filtro, clear e cross-filter.

O hook nao deve:

- montar grafico no hook;
- duplicar parsing do dataset;
- embutir regra visual;
- recalcular agregacoes pesadas fora de `useMemo`.

## Padrao visual

A composicao oficial das abas continua:

1. filtros
2. KPIs
3. visao geral
4. dados operacionais
5. acoes flutuantes

### Regras

- no maximo 2 visualizacoes por linha em desktop;
- 1 visualizacao por linha em mobile;
- tabela operacional integrada ao cross-filter;
- schema visual controlado por `html[data-dashboard-schema]`;
- fallback de erro por aba e por secao critica.

## Performance

Otimizacoes obrigatorias no estado final:

- tabs lazy-loaded;
- preload oportunistico das tabs nao ativas;
- camada `rest.js` sem codigo morto de dominios removidos;
- datasets reais carregados sob demanda e cacheados por dominio;
- mapa grande do Brasil carregado sob demanda no `ChartMapMorph`, sem entrar no caminho inicial da aba Adidas;
- exportadores pesados (`xlsx`, `jspdf`, `jspdf-autotable`) importados apenas no clique de exportacao;
- helpers compartilhados para reduzir duplicacao de cross-filter;
- `manualChunks` no Vite para separar dependencias pesadas;
- selectors memoizados antes da renderizacao dos charts.

Observacao: ECharts, datasets reais e GeoJSONs ainda podem gerar chunks grandes quando carregados, mas ficam isolados em chunks sob demanda.

### Diretriz

Qualquer nova otimizacao deve priorizar baixo risco sobre microganho. Em BI, regressao silenciosa de contrato vale mais do que ganho marginal de bundle.

## Testabilidade

Cobertura minima esperada:

- helpers compartilhados de filtros;
- selectors com agregacoes criticas;
- normalizacao e slug de status;
- build de producao sem erro.

### Prioridade futura, se houver manutencao adicional

1. testes unitarios dos selectors de Amazon, Restaurant e Logistics;
2. testes especificos do contrato normalizado por dataset;
3. smoke test de navegacao das quatro abas finais.

## Regra de evolucao

Qualquer manutencao futura deve preservar:

- apenas os quatro dominios finais;
- contrato interno estavel;
- navegacao centralizada em config;
- servico unico coerente com datasets locais ativos;
- documentacao sincronizada com a implementacao real.

## Robustez final

O estado final reforca:

- normalizacao de status centralizada em `dashboardStatus.js`;
- filtros com guards para valores nulos, arrays vazios e datas invalidas;
- tabela operacional com formatacao defensiva para datas, flags, status e moeda;
- `FilterSection` sem dependencia insegura de `ResizeObserver` ou `document.body`;
- tema claro/escuro compartilhado entre os botoes globais e flutuantes;
- erro de carregamento preservando a ultima visao disponivel quando houver dados cacheados.

## Conclusao

O projeto finalizado fica padronizado sobre uma base simples e suficiente para portfolio de BI:

- quatro abas reais;
- shell compartilhado;
- dominio isolado por selectors;
- contrato de dados uniforme;
- datasets e assets pesados sob demanda;
- tema compartilhado e persistido;
- codigo legado fora do caminho critico;
- build e testes validaveis para entrega final.
