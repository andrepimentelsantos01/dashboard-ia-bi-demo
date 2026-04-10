import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import "./ChartTreemap.css";
import { useChartTreemapState } from "./chartTreemap.state";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const colorMap = {
    Ativo: "#28a745",
    Alterado: "#6f42c1",
    Aprovado: "#20c997",
    Arquivado: "#6c757d",
    Disponível: "#17a2b8",
    "Aguardando Aprovação": "#ffc107",
    "Aguardando Julgamento": "#fd7e14",
    "Aguardando Resposta de Envio Parcial": "#fd7e14",
    "Aguardando Qualificação": "#1c466d",
    "Aguardando Envio": "#ffea00",
    "Aguardando Complemento": "#ffc107",
    "Em Recebimento": "#17a2b8",
    Bloqueado: "#dc3545",
    Ocupado: "#fd7e14",
    Cancelado: "#dc3545",
    Fechado: "#6c757d",
    Concluído: "#28a745",
    Entregue: "#28a745",
    Desclassificado: "#6c757d",
    Rascunho: "#adb5bd",
    Habilitado: "#20c997",
    Expirado: "#6c757d",
    Falhou: "#dc3545",
    "Totalmente Enviado": "#28a745",
    "Totalmente Utilizado": "#28a745",
    "Em Progresso": "#17a2b8",
    "Em Revisão": "#ffc107",
    "Em Distribuição": "#17a2b8",
    "Em Treinamento": "#6610f2",
    "Em Trânsito": "#e5700e",
    Inativo: "#6c757d",
    Inabilitado: "#dc3545",
    Integrado: "#055117",
    Convidado: "#17a2b8",
    Faturado: "#20c997",
    "Item Implantado": "#20c997",
    "Em Julgamento": "#fd7e14",
    "Em Manutenção": "#ffc107",
    "Em Revisão Mundimed": "#ffc107",
    "Sem Propostas": "#6c757d",
    "Não Aprovado": "#dc3545",
    Offline: "#6c757d",
    "Em Pausa": "#ffc107",
    Afastado: "#6c757d",
    Aberto: "#17a2b8",
    "Recebido Parcial": "#17a2b8",
    "Envio Parcial Aprovado": "#20c997",
    "Envio Parcial Rejeitado": "#dc3545",
    "Parcialmente Entregue": "#17a2b8",
    "Parcialmente Vigente": "#17a2b8",
    "Parcialmente Faturado": "#17a2b8",
    "Parcialmente Devolvido": "#fd7e14",
    "Parcialmente Enviado": "#17a2b8",
    "Parcialmente Utilizado": "#17a2b8",
    "Senha Expirada": "#dc3545",
    Pendente: "#ffc107",
    "Aguardando Ativação": "#ffc107",
    "Aguardando Exclusão": "#dc3545",
    "Separação em Andamento": "#17a2b8",
    Qualificado: "#20c997",
    "Aguardando Empenho": "#ffc107",
    "Ordem de Compra Gerada": "#20c997",
    Cotado: "#17a2b8",
    Rejeitado: "#dc3545",
    Liberado: "#20c997",
    Devolvido: "#fd7e14",
    "Devolvido para Correção": "#fd7e14",
    "Amostra Recebida": "#20c997",
    "Amostra Solicitada": "#ffc107",
    "Amostra Enviada": "#17a2b8",
    Padronizado: "#20c997",
    Suspenso: "#dc3545",
    Encerrado: "#6c757d",
    "Recebido Total": "#28a745",
    "Período de Teste": "#17a2b8",
    "Em Disputa": "#17a2b8",
    "Em Avaliação": "#ffc107",
    "Em Habilitação": "#17a2b8",
    "Em Cotação": "#17a2b8",
    Desconhecido: "#15334d"
};

const abcColorMap = { A: "#1c466d", B: "#1c466d", C: "#1c466d" };
const xyzColorMap = { X: "#1c466d", Y: "#1c466d", Z: "#1c466d" };

const ChartTreemap = ({
    backendData,
    dataOverride,
    onCrossFilter,
    height = 250,
    hideValues = false,
    abcXyzLegend = "products"
}) => {
    const { open, setOpen, data, handleClick } = useChartTreemapState({
        backendData,
        dataOverride,
        onCrossFilter
    });

    const baseData = dataOverride || data;

    const treemapData = useMemo(
        () => baseData.map((item) => ({
            ...item,
            itemStyle: {
                color: colorMap[item.name] || abcColorMap[item.name] || xyzColorMap[item.name] || "#6c757d",
                borderRadius: 14,
                shadowBlur: 18,
                shadowColor: "rgba(0,0,0,0.25)",
                shadowOffsetX: 0,
                shadowOffsetY: 4,
                borderColor: "rgba(255,255,255,0.6)",
                borderWidth: 2
            }
        })),
        [baseData]
    );

    const option = useMemo(() => ({
        tooltip: buildResponsiveTooltip((params) => {
            if (hideValues) {
                if (abcXyzLegend === "clients") {
                    return `
                        <strong>Curva ABC (Clientes)</strong><br/>
                        A - Clientes que concentram a maior parcela do faturamento.<br/>
                        B - Clientes com participação intermediária no faturamento.<br/>
                        C - Clientes de baixo impacto financeiro individual.<br/><br/>
                        <strong>Curva XYZ (Clientes)</strong><br/>
                        X - Clientes recorrentes e previsíveis.<br/>
                        Y - Clientes com variação no comportamento de compra.<br/>
                        Z - Clientes esporádicos ou sazonais.<br/><br/>
                        <strong>Matriz ABC-XYZ (Clientes)</strong><br/>
                        AX - Clientes estratégicos e recorrentes; prioridade máxima de retenção.<br/>
                        AY - Clientes estratégicos com oscilação; ações comerciais contínuas.<br/>
                        AZ - Clientes estratégicos ocasionais; abordagem sob demanda.<br/>
                        BX - Relacionamento contínuo e previsível.<br/>
                        BY - Acompanhamento periódico.<br/>
                        BZ - Ações comerciais pontuais.<br/>
                        CX - Automação comercial.<br/>
                        CY - Campanhas oportunísticas.<br/>
                        CZ - Baixíssimo custo de manutenção.
                    `;
                }

                return `
                    <strong>Curva ABC</strong><br/>
                    A - Alto impacto financeiro, poucos produtos que concentram grande parte do valor.<br/>
                    B - Impacto moderado, participação intermediária no valor total.<br/>
                    C - Baixo impacto financeiro, muitos produtos com pequena participação.<br/><br/>
                    <strong>Curva XYZ</strong><br/>
                    X - Consumo estável e previsível; demanda consistente.<br/>
                    Y - Consumo variável; oscilações sazonais exigem revisão frequente.<br/>
                    Z - Consumo irregular ou eventual; baixa previsibilidade, recomendação de uso sob demanda.<br/><br/>
                    <strong>Matriz ABC-XYZ</strong><br/>
                    AX - Alto impacto e demanda estável; itens críticos, requerem estoque mínimo garantido.<br/>
                    AY - Alto impacto e demanda variável; monitoramento contínuo e ajustes finos.<br/>
                    AZ - Alto impacto e uso eventual; compras sob demanda para evitar excesso.<br/>
                    BX - Impacto moderado e consumo estável; adequados para reposição automática.<br/>
                    BY - Impacto moderado e consumo variável; exige previsões atualizadas.<br/>
                    BZ - Impacto moderado e uso eventual; reposição guiada pela demanda recente.<br/>
                    CX - Baixo impacto e consumo estável; pode ter estoque maior com atenção à validade.<br/>
                    CY - Baixo impacto e demanda variável; controle simples com revisão periódica.<br/>
                    CZ - Baixo impacto e uso eventual; compras apenas sob demanda.
                `;
            }

            const dataPoint = params.data;

            return `
                <b>${dataPoint.name}</b><br/>
                Quantidade de Ordens: <b>${dataPoint.value}</b><br/><br/>
                <b>Volume Movimentado:</b> ${dataPoint.volume}<br/><br/>
                <b>Categoria Líder (Valor):</b> ${dataPoint.categoriaLeaderValor}<br/>
                <b>Categoria Líder (Quantidade):</b> ${dataPoint.categoriaLeaderQtd}<br/><br/>
                <b>Fornecedor Líder (Valor):</b> ${dataPoint.fornecedorLeaderValor}<br/>
                <b>Fornecedor Líder (Quantidade):</b> ${dataPoint.fornecedorLeaderQtd}<br/><br/>
                <b>Produto Líder (Valor):</b> ${dataPoint.produtoLeaderValor}<br/>
                <b>Produto Líder (Quantidade):</b> ${dataPoint.produtoLeaderQtd}<br/><br/>
                <b>Clientes Atendidos:</b> ${dataPoint.clientesAtendidos}<br/>
            `;
        }),
        series: [
            {
                type: "treemap",
                data: treemapData,
                roam: false,
                breadcrumb: { show: false },
                sort: "none",
                label: {
                    show: true,
                    formatter: (params) => (hideValues ? params.name : `${params.name}\n${params.value}`),
                    color: "#ffffff",
                    fontSize: 12
                }
            }
        ]
    }), [abcXyzLegend, hideValues, treemapData]);

    return (
        <>
            <div className="treemap-container">
                <ReactECharts
                    option={option}
                    style={{ width: "100%", height: `${height}px`, borderRadius: "18px" }}
                    onEvents={{ click: handleClick }}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={() => setOpen(false)}
                content={<ReactECharts option={option} style={{ width: "100%", height: "100%" }} />}
                isOpenInvoiced={false}
                titleCard=""
            />
        </>
    );
};

export default React.memo(ChartTreemap);
