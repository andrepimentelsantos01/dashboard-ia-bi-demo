# Blueprint BI Standalone v2

## Objetivo

Este documento define o padrao oficial para evolucao do ambiente de BI standalone.
Ele substitui o blueprint anterior com foco em:

- padronizacao arquitetural real;
- melhor separacao de responsabilidades;
- performance previsivel;
- facilidade de manutencao;
- migracao futura para backend real sem refactor estrutural grande.

Este blueprint vale para novas abas e para refatoracao progressiva das abas existentes.

---

## Principios

1. A aba nao deve conhecer detalhes do backend.
2. O contrato de dados deve entrar por uma camada de servico.
3. Normalizacao e agregacao nao devem ficar misturadas com UI.
4. Regras de filtros devem ser padronizadas e reusaveis.
5. Componentes visuais devem receber dados prontos para renderizar.
6. Performance deve ser desenhada desde a estrutura, nao corrigida no fim.

---

## Arquitetura alvo

Cada dominio do BI deve seguir esta cadeia:

`mock/api ou backend -> services -> adapters -> selectors -> hook da aba -> componente da aba`

### Responsabilidades

- `services`
  - Carregam os dados.
  - Aplicam filtros no caso de mock local.
  - Sao a unica camada autorizada a conhecer endpoint, arquivo mock ou origem externa.

- `adapters`
  - Convertem o contrato bruto da API para um modelo interno consistente.
  - Padronizam nomes como `client_name`, `supplier_name`, `order_date`, `year_months`.

- `selectors`
  - Calculam KPIs, rankings, series, mapas, cards e tabela operacional.
  - Devem ser funcoes puras.

- `hooks`
  - Gerenciam estado de interface: filtros, modal de data, reset, cross-filter, carregamento.
  - Orquestram `service + adapter + selectors`.
  - Nao devem concentrar regras grandes de agregacao.

- `tabs`
  - Compoem a tela com os componentes reutilizaveis.
  - Nao devem recalcular dominio pesado no JSX.

---

## Estrutura recomendada

```txt
src/
|
+-- app/
|   +-- providers/
|   +-- router/
|
+-- components/
|   +-- layout/
|   +-- sections/
|   +-- shared/
|
+-- features/
|   +-- dashboard/
|       +-- tabs/
|       |   +-- Overview/
|       |   |   +-- Overview.jsx
|       |   |   +-- overview.hook.js
|       |   |   +-- Overview.css
|       |   +-- Products/
|       |   +-- Clients/
|       |   +-- Suppliers/
|       |   +-- Quotations/
|       |   +-- Orders/
|       |
|       +-- services/
|       |   +-- dashboard.service.js
|       |
|       +-- adapters/
|       |   +-- overview.adapter.js
|       |   +-- products.adapter.js
|       |   +-- clients.adapter.js
|       |   +-- suppliers.adapter.js
|       |   +-- quotations.adapter.js
|       |   +-- orders.adapter.js
|       |
|       +-- selectors/
|       |   +-- common/
|       |   +-- overview.selectors.js
|       |   +-- products.selectors.js
|       |   +-- clients.selectors.js
|       |   +-- suppliers.selectors.js
|       |   +-- quotations.selectors.js
|       |   +-- orders.selectors.js
|       |
|       +-- config/
|       |   +-- filters.config.js
|       |   +-- tabs.config.js
|       |
|       +-- mocks/
|           +-- api/
|               +-- overview.json
|               +-- products.json
|               +-- clients.json
|               +-- suppliers.json
|               +-- quotations.json
|               +-- orders.json
|
+-- services/
|   +-- http/
|   +-- auth/
|
+-- utils/
|   +-- dates/
|   +-- format/
|   +-- filters/
```

### Observacao

No estado atual do projeto, parte desse papel esta centralizada em [rest.js](C:/Users/Mundimed-10/Downloads/dashboard/src/services/rest.js). Isso foi correto para tirar a feature do SaaS original, mas o proximo passo e quebrar essa camada por dominio e por responsabilidade.

---

## Contrato de dados

O modelo interno do dashboard precisa ser unico e estavel.

Toda aba deve trabalhar sobre um shape normalizado como este:

```js
{
  row_id: 1,
  client_id: "client-1",
  client_name: "Hospital Sao Paulo",
  supplier_id: "supplier-1",
  supplier_name: "Fornecedor X",
  product_id: "product-1",
  product_name: "Produto X",
  product_class_material_name: "Medicamentos",
  client_state: "SP",
  order_date: "2024-03-10",
  year_months: "2024-03",
  purchase_order_id: 1234,
  quotation_code: 5678,
  quantity_requested: 100,
  sum_quantity_requested: 100,
  sum_quantity: 100,
  total_amount: 5000,
  sum_total_amount: 5000,
  avg_unit_price: 50,
  unit_price: 50,
  item_status: "Entregue",
  quotation_status: "finalized",
  glosa: 0,
  sum_glosa_amount: 0,
  abc_classification: "A",
  xyz_classification: "X"
}
```

### Regra

Nenhum componente visual deve depender de chaves alternativas como `cliente`, `fornecedor`, `produto` se o modelo normalizado ja existir.

---

## Regras para mocks

Os mocks devem simular o backend, nao a UI.

### O que fazer

- Centralizar mocks em `mocks/api/`.
- Manter um arquivo por dominio.
- Usar o mesmo schema que o servico consumiria do backend real.
- Se necessario, gerar dados derivados dentro de `selectors`, nao no JSON.

### O que evitar

- Mock por aba com shape acoplado ao JSX.
- Estruturas diferentes para cada dominio sem justificativa.
- Campos duplicados apenas para acomodar componentes.

### Regra de ouro

Se o backend real pudesse substituir o mock sem alterar o componente da aba, o mock esta no lugar certo.

---

## Blueprint de uma nova aba

Toda nova aba deve ter:

```txt
tabs/<NomeDaAba>/
|
+-- <NomeDaAba>.jsx
+-- <nomeDaAba>.hook.js
+-- <NomeDaAba>.css
```

### O componente da aba deve:

- consumir um hook unico da aba;
- montar filtros, KPIs, overview e tabela;
- usar apenas dados prontos;
- evitar `useMemo` pesado para regra de negocio.

### O hook da aba deve:

- manter `filters`, `tempDateRange`, `openDateModal`, `resetToken`;
- chamar o servico;
- aplicar adapter;
- chamar selectors;
- expor handlers de UI.

### O hook da aba nao deve:

- fazer agregacoes longas inline;
- recalcular series complexas duplicadas em cada render;
- conhecer detalhes de componente de grafico.

---

## Pipeline padrao da aba

```txt
1. carregar dados brutos via service
2. adaptar dados para modelo normalizado
3. aplicar filtros base
4. gerar listas de filtros disponiveis
5. gerar KPIs
6. gerar charts
7. gerar tabela operacional
8. entregar view model para a aba
```

---

## Padrao de filtros

Os filtros devem ser unificados em um modelo compartilhado:

```js
export const initialFilters = {
  dateRange: null,
  suppliers: [],
  clients: [],
  categorias: [],
  produtos: [],
  orders: [],
  numeroCotacao: [],
  status: [],
  mes: null,
  uf: null,
  classificacaoABC: null,
  classificacaoXYZ: null
};
```

### Regras

- Toda aba usa o mesmo shape base.
- Campos nao usados podem ser ignorados, mas nao reinventados.
- `handleFieldChange`, `clearFilters` e `handleCrossFilter` devem seguir API padrao.

### Padrao para cross-filter

```js
{ type: "cliente", id: "...", value: "Hospital X" }
{ type: "fornecedor", id: "...", value: "Fornecedor X" }
{ type: "produto", id: "...", value: "Produto X" }
{ type: "categoria", value: "Medicamentos" }
{ type: "mes", value: "2024-03" }
{ type: "status", value: "Entregue" }
{ type: "uf", value: "SP" }
{ type: "reset" }
```

### Diretriz

O mapeamento de `payload.type -> alteracao em filtros` deve ser compartilhado quando possivel, nao reimplementado em cada aba.

---

## Selectors padronizados

Selectors devem ser funcoes puras e reaproveitaveis.

### Exemplo de grupos

- `buildAvailableClients(rows)`
- `buildAvailableSuppliers(rows)`
- `buildKpis(rows)`
- `buildMonthlyHistory(rows)`
- `buildCategoryDistribution(rows)`
- `buildOperationalTable(rows)`
- `buildMapData(rows)`

### Beneficios

- remove duplicacao dos `*.state.js`;
- facilita teste unitario;
- melhora previsibilidade de performance;
- reduz risco de divergencia entre abas.

---

## Padrao visual e composicao

A ordem das secoes continua a mesma:

1. filtro de periodo
2. filtros e segmentacao
3. KPIs
4. visao geral
5. dados operacionais
6. botao flutuante de limpar

### Regras visuais

- no maximo 2 graficos por linha em desktop;
- 1 grafico por linha em mobile;
- KPI cards com altura minima consistente;
- tabela operacional com altura controlada e cabecalho fixo;
- sem margens negativas estruturais;
- sem layout depender de overflow acidental.

---

## Performance

Performance e obrigatoria no blueprint.

### Regras

1. Dados brutos devem ser carregados uma vez por mudanca de filtro relevante.
2. Normalizacao deve ocorrer uma vez por payload.
3. Selectors devem ser memoizados no hook, nao espalhados no JSX.
4. Componentes de grafico devem receber apenas props necessarias.
5. O mapa deve permanecer lazy-loaded.
6. Evitar recalculo de arrays grandes em varios componentes filhos.
7. Nao usar `useMemo` por reflexo; usar onde ha custo real.

### Alertas atuais do projeto

- hooks de aba fazem normalizacao e agregacao juntos;
- logica de listas disponiveis e cross-filter esta duplicada;
- bundle do mapa e muito pesado;
- varios graficos recebem tabelas completas quando poderiam receber shape reduzido.

### Metas de evolucao

- mover agregadores para selectors;
- separar `ChartMap` em chunk isolado;
- reduzir props de alto volume;
- criar cache simples por dominio quando fizer sentido.

---

## Integracao futura com backend real

Quando a API real substituir o mock:

1. trocar apenas a implementacao de `services`;
2. preservar `adapters`;
3. preservar `selectors`;
4. preservar `hooks` e `tabs` com alteracoes minimas.

### Regra

Se a troca do backend exigir mudar componente visual, a arquitetura esta vazando contrato demais.

---

## Testabilidade

O projeto deve ser testavel por camadas.

### Prioridade de testes

- `adapters`
  - garantem normalizacao consistente;
- `selectors`
  - garantem calculo de KPIs e series;
- `services`
  - garantem aplicacao correta dos filtros locais;
- `hooks`
  - apenas comportamento de orquestracao;
- `components`
  - preferencialmente testes visuais/comportamentais leves.

---

## Convencoes de codigo

### Nomes

- `*.hook.js` para hooks de aba;
- `*.adapter.js` para normalizadores;
- `*.selectors.js` para agregadores;
- `*.service.js` para acesso a dados.

### Regras

- ASCII por padrao em arquivos de codigo;
- evitar literais repetidos de status e labels;
- mover configuracoes repetidas para `config/`;
- componentes devem ser pequenos e previsiveis.

---

## Estrategia de migracao a partir do estado atual

Como o projeto ja funciona, a evolucao deve ser incremental.

### Fase 1

- manter o standalone funcional;
- consolidar este blueprint;
- estabilizar imports e contratos.

### Fase 2

- extrair selectors compartilhados das abas atuais;
- extrair helpers de filtros;
- reduzir duplicacao dos `*.state.js`.

### Fase 3

- quebrar [rest.js](C:/Users/Mundimed-10/Downloads/dashboard/src/services/rest.js) em servicos por dominio;
- criar adapters dedicados;
- migrar `state.js` para `*.hook.js`.

### Fase 4

- adicionar testes para adapters e selectors;
- otimizar chunking e graficos pesados;
- preparar transicao para backend real.

---

## Template de implementacao

```js
// products.hook.js
export const useProductsTab = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [openDateModal, setOpenDateModal] = useState(false);
  const [tempDateRange, setTempDateRange] = useState(null);

  const rawResponse = useProductsData(filters);
  const normalizedRows = useMemo(
    () => adaptProductsResponse(rawResponse),
    [rawResponse]
  );

  const filteredRows = useMemo(
    () => applyDashboardFilters(normalizedRows, filters),
    [normalizedRows, filters]
  );

  const viewModel = useMemo(
    () => buildProductsViewModel(filteredRows),
    [filteredRows]
  );

  return {
    filters,
    setFilters,
    openDateModal,
    setOpenDateModal,
    tempDateRange,
    setTempDateRange,
    ...viewModel
  };
};
```

Este e o padrao desejado. Curto no hook, forte nas camadas.

---

## Conclusao

O Blueprint v2 formaliza o caminho certo para o standalone:

- abas simples;
- hooks orquestradores;
- dados centralizados;
- selectors puros;
- contrato estavel;
- performance tratada como requisito.

Ele nao congela o legado atual.
Ele cria uma trilha segura para padronizar o que ja existe e crescer sem acumular mais acoplamento.
