import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import "./ChartTreemap.css";
import { useChartTreemapState } from "./chartTreemap.state";
import { buildResponsiveTooltip } from "../chartTooltip.helpers";

const colorMap = {
    Ativo: "#0f4f4c",
    Alterado: "#12635e",
    Aprovado: "#177972",
    Arquivado: "#93a9a6",
    "Disponível": "#1b8f86",
    "Aguardando Aprovação": "#22a69b",
    "Aguardando Julgamento": "#40b8ad",
    "Aguardando Resposta de Envio Parcial": "#40b8ad",
    "Aguardando Qualificação": "#12635e",
    "Aguardando Envio": "#63c9c0",
    "Aguardando Complemento": "#22a69b",
    "Em Recebimento": "#1b8f86",
    Bloqueado: "#0e4946",
    Ocupado: "#40b8ad",
    Cancelado: "#0e4946",
    Fechado: "#93a9a6",
    Concluído: "#177972",
    Entregue: "#177972",
    Desclassificado: "#93a9a6",
    Rascunho: "#b4c6c3",
    Habilitado: "#177972",
    Expirado: "#93a9a6",
    Falhou: "#0e4946",
    "Totalmente Enviado": "#177972",
    "Totalmente Utilizado": "#177972",
    "Em Progresso": "#1b8f86",
    "Em Revisão": "#22a69b",
    "Em Distribuição": "#1b8f86",
    "Em Treinamento": "#63c9c0",
    "Em Trânsito": "#40b8ad",
    Atrasado: "#12635e",
    Inativo: "#93a9a6",
    Inabilitado: "#0e4946",
    Integrado: "#0f4f4c",
    Convidado: "#1b8f86",
    Faturado: "#177972",
    "Item Implantado": "#177972",
    "Em Julgamento": "#40b8ad",
    "Em Manutenção": "#22a69b",
    "Em Revisão Mundimed": "#22a69b",
    "Sem Propostas": "#93a9a6",
    "Não Aprovado": "#0e4946",
    Offline: "#93a9a6",
    "Em Pausa": "#22a69b",
    Afastado: "#93a9a6",
    Aberto: "#1b8f86",
    "Recebido Parcial": "#1b8f86",
    "Envio Parcial Aprovado": "#177972",
    "Envio Parcial Rejeitado": "#0e4946",
    "Parcialmente Entregue": "#1b8f86",
    "Parcialmente Vigente": "#1b8f86",
    "Parcialmente Faturado": "#1b8f86",
    "Parcialmente Devolvido": "#40b8ad",
    "Parcialmente Enviado": "#1b8f86",
    "Parcialmente Utilizado": "#1b8f86",
    "Senha Expirada": "#0e4946",
    Pendente: "#22a69b",
    "Aguardando Ativação": "#22a69b",
    "Aguardando Exclusão": "#0e4946",
    "Separação em Andamento": "#1b8f86",
    Qualificado: "#177972",
    "Aguardando Empenho": "#22a69b",
    "Ordem de Compra Gerada": "#177972",
    Cotado: "#1b8f86",
    Rejeitado: "#0e4946",
    Liberado: "#177972",
    Devolvido: "#40b8ad",
    "Devolvido para Correção": "#40b8ad",
    "Amostra Recebida": "#177972",
    "Amostra Solicitada": "#22a69b",
    "Amostra Enviada": "#1b8f86",
    Padronizado: "#177972",
    Suspenso: "#0e4946",
    Encerrado: "#93a9a6",
    "Recebido Total": "#177972",
    "Período de Teste": "#1b8f86",
    "Em Disputa": "#1b8f86",
    "Em Avaliação": "#22a69b",
    "Em Habilitação": "#1b8f86",
    "Em Cotação": "#1b8f86",
    "Sem status": "#93a9a6",
    Desconhecido: "#26717e"
};

const abcColorMap = { A: "#0f4f4c", B: "#177972", C: "#63c9c0" };
const xyzColorMap = { X: "#12635e", Y: "#1b8f86", Z: "#87dad3" };

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
                color: colorMap[item.name] || abcColorMap[item.name] || xyzColorMap[item.name] || "#93a9a6",
                borderRadius: 14,
                shadowBlur: 18,
                shadowColor: "rgba(12,56,53,0.20)",
                shadowOffsetX: 0,
                shadowOffsetY: 4,
                borderColor: "rgba(255,255,255,0.65)",
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
