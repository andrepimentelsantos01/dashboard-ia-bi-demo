export const CURVE_BUTTONS_CONTEXT =
    "Use os botoes para filtrar por classificacao ABC e XYZ. ABC mostra relevancia financeira: A maior impacto, B intermediario e C menor participacao. XYZ mostra previsibilidade: X mais estavel, Y variacao moderada e Z maior oscilacao.";
export const PIE_CONTEXT =
    "Este grafico mostra a participacao relativa de cada categoria no total analisado. Quanto maior a fatia, maior a contribuicao daquele grupo para o resultado consolidado. Use a visualizacao para identificar concentracao, dependencia excessiva de poucos grupos, distribuicao do mix e oportunidades de rebalanceamento. A leitura mais eficiente e comparar o peso percentual entre as categorias e observar quais grupos dominam a composicao geral.";

export const TREEMAP_CONTEXT =
    "O treemap representa a distribuicao dos grupos em blocos proporcionais ao seu peso no total analisado. Blocos maiores indicam maior relevancia relativa, enquanto as cores ajudam a destacar diferencas visuais entre grupos. Esse grafico e especialmente util para localizar rapidamente concentracoes, desbalanceamentos e clusters dominantes. Use-o quando quiser entender a hierarquia visual dos grupos sem depender apenas de ranking linear.";

export const STACKED_BAR_CONTEXT =
    "Use este grafico para comparar a composicao de cada periodo ou agrupamento por categoria, status ou classe. O tamanho total da barra representa o volume consolidado daquele periodo, enquanto cada segmento colorido mostra quanto cada grupo contribui para esse total. A melhor leitura e observar ao mesmo tempo o total da barra e a mudanca na participacao relativa das cores ao longo dos periodos. Isso ajuda a identificar mudancas de mix, crescimento ou retracao de grupos especificos e alteracoes no comportamento operacional.";

export const HEATMAP_CONTEXT =
    "O mapa de calor cruza duas dimensoes, como categoria e mes, usando intensidade de cor para representar a concentracao de valor, volume ou ocorrencias. Quanto mais intenso o tom, maior a magnitude naquela combinacao. Use esse grafico para detectar sazonalidade, picos de concentracao, meses atipicos e padroes recorrentes. A melhor forma de leitura e comparar linhas, colunas e pontos de maior contraste visual para localizar rapidamente anomalias e concentracoes relevantes.";

export const SCATTER_CONTEXT =
    "Cada ponto representa um agrupamento de itens. A posicao horizontal mostra o comportamento no eixo X, a posicao vertical mostra o comportamento no eixo Y e o tamanho da bolha indica a relevancia agregada do grupo. Esse grafico e ideal para identificar concentracoes, dispersoes, outliers e relacoes entre variaveis. Use a leitura por quadrantes para entender quais grupos combinam alto valor com alto volume, baixo valor com alta recorrencia ou comportamentos fora do padrao esperado.";

export const BOXPLOT_CONTEXT =
    "O boxplot mostra a distribuicao de uma metrica dentro de cada grupo. A linha central representa a mediana, a caixa cobre os quartis de 25% a 75%, as hastes indicam a faixa esperada e os pontos isolados destacam outliers. Use essa visualizacao para comparar estabilidade, dispersao e dependencia de eventos atipicos entre produtos, categorias, operadores ou transportadoras.";

export const HORIZONTAL_BAR_CONTEXT =
    "O grafico de barras horizontais e indicado para ranking e comparacao direta entre grupos. Os itens normalmente sao exibidos do maior para o menor, facilitando a leitura das liderancas, das quedas e da distancia entre posicoes. Use esse grafico para identificar rapidamente quem mais contribui para o resultado, quais grupos perderam relevancia e onde existe maior concentracao. A leitura mais eficiente e observar a ordem, o tamanho relativo das barras e o espacamento entre os primeiros colocados.";

export const LINE_CONTEXT =
    "O grafico de linha mostra a evolucao de uma metrica ao longo do tempo. Ele e ideal para acompanhar tendencia, aceleracao, desaceleracao, estabilidade, sazonalidade e pontos de ruptura. Use essa visualizacao para entender se a serie esta crescendo, caindo ou oscilando, e para comparar a intensidade das variacoes entre periodos consecutivos. A melhor leitura e observar a inclinacao da curva, a recorrencia dos picos e vales e a consistencia do comportamento temporal.";

export const VERTICAL_BAR_CONTEXT =
    "O grafico de barras verticais e indicado para comparar valores entre categorias ou periodos de forma objetiva. Cada barra representa a magnitude de um grupo especifico, permitindo identificar diferencas de volume, participacao e desempenho. Quando aplicado em serie temporal, a leitura ajuda a comparar a intensidade de cada periodo; quando aplicado em ranking, ajuda a localizar destaques positivos e negativos. Observe principalmente a altura relativa das barras, a ordenacao padrao e a presenca de concentracoes ou distribuicoes mais equilibradas.";

export const GAUGE_CONTEXT = {
    sla:
        "Este indicador mostra o percentual medio de entregas realizadas dentro do prazo. Quanto mais proximo de 100%, maior a consistencia operacional e melhor o nivel de servico. Use esse KPI para acompanhar confiabilidade de execucao, estabilidade da operacao e aderencia aos prazos acordados.",

    glosa:
        "Este indicador mostra o percentual medio de valor glosado sobre o total analisado. Quanto menor o percentual, menor a perda financeira, divergencia ou inconsistencia no processo. Use esse KPI para monitorar qualidade operacional, impacto financeiro de desvios e necessidade de acao corretiva.",

    atraso:
        "Este indicador mostra o percentual de pedidos entregues com atraso. Quanto menor o valor, menor o risco operacional e maior a confiabilidade da cadeia de abastecimento. Use esse KPI para acompanhar gargalos logísticos, impacto de atraso no fluxo operacional e necessidade de ajuste nos processos."
};

export const KPI_VARIATION_CONTEXT =
    "Este indicador complementar mostra a variacao percentual do valor atual em relacao ao periodo imediatamente anterior. Ele deve ser usado para avaliar crescimento, queda ou estabilidade da metrica. Valores positivos indicam aumento, valores negativos indicam reducao e variacoes proximas de zero indicam estabilidade relativa. A interpretacao correta sempre deve considerar o contexto do indicador principal, pois aumento pode ser bom em alguns casos e ruim em outros.";

export const MATRIX_ABCXYZ_CONTEXT =
    "A Matriz ABC-XYZ combina duas dimensoes analiticas: relevancia financeira e previsibilidade de comportamento. A dimensao ABC mostra o peso economico do item no resultado total, enquanto a dimensao XYZ mostra o nivel de estabilidade ou oscilacao ao longo do tempo. O cruzamento dessas visoes permite separar itens estrategicos e previsiveis daqueles que, mesmo relevantes, apresentam alta volatilidade. Use a matriz para priorizar acompanhamento, definir politicas de estoque, orientar negociacao, calibrar nivel de controle e distribuir esforco gerencial de forma mais inteligente.";

export const ABCXYZ_DICTIONARY_CONTEXT = {
    AX: {
        title: "AX",
        summary: "Alta relevancia financeira e alta previsibilidade.",
        interpretation:
            "Itens estrategicos, com forte impacto no resultado e comportamento estavel. Representam o melhor cenario para planejamento, reposicao e controle fino.",
        action:
            "Aplicar prioridade maxima, controle rigoroso, politicas bem definidas de reposicao, acompanhamento frequente e metas operacionais mais agressivas."
    },

    AY: {
        title: "AY",
        summary: "Alta relevancia financeira e variacao moderada.",
        interpretation:
            "Itens muito importantes para o resultado, mas com comportamento menos estavel que AX. Exigem atencao elevada e leitura analitica mais frequente.",
        action:
            "Monitorar tendencia, revisar sazonalidade, ajustar parametros com mais frequencia e trabalhar com margem de seguranca moderada."
    },

    AZ: {
        title: "AZ",
        summary: "Alta relevancia financeira e alta oscilacao.",
        interpretation:
            "Perfil critico. Esses itens impactam fortemente o resultado, mas apresentam baixa previsibilidade, aumentando o risco operacional e decisorio.",
        action:
            "Aplicar monitoramento intensivo, revisar premissas periodicamente, investigar causas de oscilacao e usar estrategias de contingencia quando necessario."
    },

    BX: {
        title: "BX",
        summary: "Impacto financeiro intermediario e alta previsibilidade.",
        interpretation:
            "Itens consistentes, com comportamento estavel e relevancia media. Permitem boa eficiencia de gestao sem o mesmo nivel de criticidade dos itens A.",
        action:
            "Usar politicas padronizadas, regras claras de reposicao, controle regular e foco em eficiencia operacional."
    },

    BY: {
        title: "BY",
        summary: "Impacto financeiro intermediario e variacao moderada.",
        interpretation:
            "Itens de relevancia media com algum grau de oscilacao. Exigem equilibrio entre controle e simplicidade operacional.",
        action:
            "Fazer revisoes periodicas, acompanhar desvios e ajustar politicas conforme mudanca de comportamento."
    },

    BZ: {
        title: "BZ",
        summary: "Impacto financeiro intermediario e alta oscilacao.",
        interpretation:
            "Itens com relevancia razoavel, mas comportamento instavel. Podem gerar ruido operacional acima do esperado para sua faixa de importancia.",
        action:
            "Monitorar excecoes, investigar picos e quedas, evitar confiar apenas em medias historicas e avaliar necessidade de tratamento especifico."
    },

    CX: {
        title: "CX",
        summary: "Baixo impacto financeiro e alta previsibilidade.",
        interpretation:
            "Itens de menor relevancia economica, mas com comportamento estavel. Sao bons candidatos a processos simplificados e alta automacao.",
        action:
            "Aplicar gestao enxuta, reposicao automatizada quando fizer sentido e baixo esforco gerencial."
    },

    CY: {
        title: "CY",
        summary: "Baixo impacto financeiro e variacao moderada.",
        interpretation:
            "Itens de baixa prioridade financeira com alguma oscilacao. Normalmente nao justificam alto esforco analitico, salvo excecoes do negocio.",
        action:
            "Acompanhar por excecao, manter regras simples e intervir apenas quando houver desvios relevantes."
    },

    CZ: {
        title: "CZ",
        summary: "Baixo impacto financeiro e alta oscilacao.",
        interpretation:
            "Itens de baixa relevancia financeira e comportamento instavel. Em geral, nao devem consumir esforco gerencial excessivo.",
        action:
            "Evitar sobregerenciamento, tratar com criterios simplificados e analisar individualmente apenas quando houver anomalia, custo oculto ou risco indireto."
    }
};
