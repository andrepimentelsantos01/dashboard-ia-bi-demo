import { useState, useMemo, useCallback } from "react";

const toNumber = (v) => {
    if (typeof v === "number") return v;
    if (!v) return 0;
    return (
        Number(
            v
                .toString()
                .replace(/\./g, "")
                .replace(",", ".")
                .replace(/[^\d.-]/g, "")
        ) || 0
    );
};

const STATUS_MAP = {
    active: "Ativo",
    amended: "Alterado",
    approved: "Aprovado",
    archived: "Arquivado",
    available: "Disponível",
    awaiting_approval: "Aguardando Aprovação",
    awaiting_judgement: "Aguardando Julgamento",
    awaiting_partial_shipment_response: "Aguardando Resposta de Envio Parcial",
    awaiting_qualification: "Aguardando Qualificação",
    awaiting_shipment: "Aguardando Envio",
    awaiting_supplement: "Aguardando Complemento",
    being_received: "Em Recebimento",
    blocked: "Bloqueado",
    busy: "Ocupado",
    canceled: "Cancelado",
    cancelled: "Cancelado",
    closed: "Fechado",
    completed: "Concluído",
    delivered: "Entregue",
    disqualified: "Desclassificado",
    draft: "Rascunho",
    eligible: "Habilitado",
    expired: "Expirado",
    failed: "Falhou",
    fully_shipped: "Totalmente Enviado",
    fully_used: "Totalmente Utilizado",
    in_progess: "Em Progresso",
    in_progress: "Em Progresso",
    in_review: "Em Revisão",
    in_sorting: "Em Distribuição",
    in_training: "Em Treinamento",
    in_transit: "Em Trânsito",
    inactive: "Inativo",
    ineligible: "Inabilitado",
    integrated: "Integrado",
    invited: "Convidado",
    invoiced: "Faturado",
    item_implemented: "Item Implantado",
    judgement: "Em Julgamento",
    maintenance: "Em Manutenção",
    mundimed_review: "Em Revisão Mundimed",
    no_bids_received: "Sem Propostas",
    not_approved: "Não Aprovado",
    offline: "Offline",
    on_break: "Em Pausa",
    on_leave: "Afastado",
    open: "Aberto",
    partial_received: "Recebido Parcial",
    partial_shipment_approved: "Envio Parcial Aprovado",
    partial_shipment_rejected: "Envio Parcial Rejeitado",
    partially_delivered: "Parcialmente Entregue",
    partially_in_force: "Parcialmente Vigente",
    partially_invoiced: "Parcialmente Faturado",
    partially_returned: "Parcialmente Devolvido",
    partially_shipped: "Parcialmente Enviado",
    partially_used: "Parcialmente Utilizado",
    passwordexpired: "Senha Expirada",
    pending: "Pendente",
    pendingactivation: "Aguardando Ativação",
    pendingdeletion: "Aguardando Exclusão",
    picking_in_progress: "Separação em Andamento",
    qualified: "Qualificado",
    qualified_awaiting_commitment: "Aguardando Empenho",
    qualified_purchase_order_issued: "Ordem de Compra Gerada",
    quoted: "Cotado",
    rejected: "Rejeitado",
    released: "Liberado",
    returned: "Devolvido",
    returned_for_correction: "Devolvido para Correção",
    sample_received: "Amostra Recebida",
    sample_requested: "Amostra Solicitada",
    sample_sent: "Amostra Enviada",
    sorting: "Em Distribuição",
    standardized: "Padronizado",
    suspended: "Suspenso",
    terminated: "Encerrado",
    total_received: "Recebido Total",
    trialperiod: "Período de Teste",
    under_bidding: "Em Disputa",
    under_evaluation: "Em Avaliação",
    under_qualification: "Em Habilitação",
    under_quotation: "Em Cotação",
    under_review: "Em Revisão",
    underreview: "Em Revisão"
};

const normalizeStatus = (v) => {
    if (v === null || v === undefined || v === "") return "Cotação Sem Status";
    const s = String(v)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

    return STATUS_MAP[s] || "Desconhecido";
};

export const useChartTreemapState = ({ backendData, dataOverride, onCrossFilter }) => {
    const [open, setOpen] = useState(false);
    const [last, setLast] = useState(null);

    const { grouped, data } = useMemo(() => {
        if (dataOverride) {
            return { grouped: null, data: dataOverride };
        }

        const source = backendData || [];
        const map = {};
        const resultMap = {};

        for (let i = 0; i < source.length; i++) {
            const item = source[i];
            const statusLabel = normalizeStatus(item.item_status);

            if (!map[statusLabel]) {
                map[statusLabel] = [];
                resultMap[statusLabel] = {
                    name: statusLabel,
                    statusKey: item.item_status,
                    value: 0,
                    volume: 0,
                    categoriaValor: {},
                    categoriaQtd: {},
                    fornecedorValor: {},
                    fornecedorQtd: {},
                    produtoValor: {},
                    produtoQtd: {},
                    clientes: new Set()
                };
            }

            const group = resultMap[statusLabel];
            const valor = toNumber(item.valorTotal);
            const qtd = item.quantidade || 0;

            map[statusLabel].push(item);

            group.value += 1;
            group.volume += qtd;

            if (item.categoria) {
                group.categoriaValor[item.categoria] = (group.categoriaValor[item.categoria] || 0) + valor;
                group.categoriaQtd[item.categoria] = (group.categoriaQtd[item.categoria] || 0) + qtd;
            }

            if (item.fornecedor) {
                group.fornecedorValor[item.fornecedor] = (group.fornecedorValor[item.fornecedor] || 0) + valor;
                group.fornecedorQtd[item.fornecedor] = (group.fornecedorQtd[item.fornecedor] || 0) + qtd;
            }

            if (item.produto) {
                group.produtoValor[item.produto] = (group.produtoValor[item.produto] || 0) + valor;
                group.produtoQtd[item.produto] = (group.produtoQtd[item.produto] || 0) + qtd;
            }

            if (item.cliente) {
                group.clientes.add(item.cliente);
            }
        }

        const getTop = (obj) => {
            let maxKey = "—";
            let maxVal = -Infinity;

            for (const k in obj) {
                if (obj[k] > maxVal) {
                    maxVal = obj[k];
                    maxKey = k;
                }
            }

            return maxKey;
        };

        const data = Object.values(resultMap).map((g) => ({
            name: g.name,
            statusKey: g.statusKey,
            value: g.value,
            volume: g.volume,
            categoriaLeaderValor: getTop(g.categoriaValor),
            categoriaLeaderQtd: getTop(g.categoriaQtd),
            fornecedorLeaderValor: getTop(g.fornecedorValor),
            fornecedorLeaderQtd: getTop(g.fornecedorQtd),
            produtoLeaderValor: getTop(g.produtoValor),
            produtoLeaderQtd: getTop(g.produtoQtd),
            clientesAtendidos: g.clientes.size
        }));

        return { grouped: map, data };
    }, [backendData, dataOverride]);

    const handleClick = useCallback(
        (params) => {
            const name = params?.data?.name;
            const statusKey = params?.data?.statusKey;

            if (!name || !onCrossFilter) return;

            if (last === name) {
                setLast(null);
                onCrossFilter({ type: "reset" });
                return;
            }

            setLast(name);

            if (dataOverride) {
                if (name === "A" || name === "B" || name === "C") {
                    onCrossFilter({ type: "abc", value: name });
                    return;
                }
                if (name === "X" || name === "Y" || name === "Z") {
                    onCrossFilter({ type: "xyz", value: name });
                    return;
                }
            }

            onCrossFilter({
                type: "status",
                value: statusKey?.trim()
            });
        },
        [last, onCrossFilter, dataOverride]
    );

    return {
        open,
        setOpen,
        grouped,
        data,
        handleClick
    };
};