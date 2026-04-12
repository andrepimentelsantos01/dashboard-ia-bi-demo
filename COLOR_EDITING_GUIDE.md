# Manual de Edicao de Cores

Este arquivo resume onde alterar cores nas abas tematizadas do projeto sem espalhar mudancas pelo codigo.

## 1. Shell global da aba ativa

Arquivo:
- `src/styles/app.css`

Uso:
- altera o fundo geral da pagina;
- altera o hero/topo;
- altera o botao flutuante e elementos externos ao conteudo da aba.

Onde mexer:
- blocos `html[data-dashboard-schema="adidas"]`
- blocos `html[data-dashboard-schema="amazon"]`
- blocos `html[data-dashboard-schema="restaurant"]`

Quando usar:
- quando quiser trocar a identidade geral da tela ao clicar na aba.

## 2. Botao das tabs

Arquivos:
- `src/dashboard/index.jsx`
- `src/dashboard/index.css`

Uso:
- `index.jsx` define qual `schema` cada aba ativa;
- `index.css` controla a cor visual do botao da tab ativa/inativa.

Onde mexer:
- `TABS` em `src/dashboard/index.jsx`
- classes `.dashboard-tab-btn--adidas`
- classes `.dashboard-tab-btn--amazon`
- classes `.dashboard-tab-btn--restaurant`

Quando usar:
- quando quiser mudar a cor do botao da aba sem impactar o restante do dashboard.

## 3. Tokens locais da propria aba

Arquivos:
- `src/dashboard/tabs/Overview/Overview.css`
- `src/dashboard/tabs/Products/Products.css`
- `src/dashboard/tabs/Clients/Clients.css`

Uso:
- controla superficies, bordas, textos e acentos internos da aba;
- cada arquivo define variaveis `--bi-*` do escopo local.

Onde mexer:
- `.adidas-scope` ou regras locais equivalentes na aba Adidas
- `.amazon-scope`
- `.restaurant-scope`

Principais tokens:
- `--bi-surface`: fundo dos cards
- `--bi-surface-strong`: fundo mais forte
- `--bi-surface-soft`: gradiente interno
- `--bi-border`: borda padrao
- `--bi-border-strong`: borda/acento forte
- `--bi-text`: texto principal
- `--bi-text-soft`: texto secundario
- `--bi-brand`: cor principal da marca
- `--bi-brand-strong`: cor principal forte
- `--bi-accent`: cor de destaque
- `--bi-accent-soft`: destaque suave

Quando usar:
- quando quiser mudar a paleta interna da aba sem tocar na pagina inteira.

## 4. Cards KPI

Arquivo:
- `src/dashboard/components/shared/kpiCard/KpiCard.css`

Uso:
- controla gradiente, texto e glow dos cards KPI.

Onde mexer:
- blocos por schema em `html[data-dashboard-schema="..."]`

Quando usar:
- quando os KPIs precisarem seguir a marca da aba.

## 5. Secoes, headers e containers

Arquivo:
- `src/dashboard/components/SectionWrapper.css`

Uso:
- controla titulo da secao, linha lateral, icones de expansao e superficie das secoes.

Quando usar:
- quando o verde padrao ainda aparece nos wrappers de secao.

## 6. Tabela operacional

Arquivo:
- `src/dashboard/components/shared/dataTable/DataTable.css`

Uso:
- controla toolbar, campo de busca, botoes de exportacao, cabeçalho, linhas, scrollbar e feedback de download.

Quando usar:
- quando a tabela ainda estiver com cor fora do schema da aba.

## 7. Cores dos graficos

Arquivo principal:
- `src/dashboard/components/shared/charts/chartTheme.js`

Uso:
- centraliza tokens de cor usados pelos charts;
- define paletas monocromas e coloridas por schema.

O que alterar:
- `chartPrimary`
- `chartAreaFill`
- `statusPalette`
- `heatmapScale`
- `piePalette`
- `treemapPalette`
- `scatterPalette`

Quando usar:
- quando barras, linhas, heatmap, pie, treemap ou stacked bar precisarem acompanhar a marca da aba.

## 8. Status badges

Arquivo:
- `src/dashboard/selectors/shared/dashboardStatus.js`

Uso:
- controla label normalizada e cor dos badges de status na tabela e nos charts por status.

Onde mexer:
- `STATUS_LABELS`
- `STATUS_COLOR_MAP`

Quando usar:
- quando surgir um novo status do dataset ou quando a cor atual dele nao for adequada.

## 9. Regras praticas

- Para mudar a identidade completa de uma aba, comece por `index.jsx`, `app.css` e o CSS local da tab.
- Para mudar so charts, altere primeiro `chartTheme.js`.
- Para mudar so tabela, altere `DataTable.css` e, se necessario, `dashboardStatus.js`.
- Para evitar regressao, nunca replique cor hardcoded em varios componentes se o elemento ja usa schema ou token.
