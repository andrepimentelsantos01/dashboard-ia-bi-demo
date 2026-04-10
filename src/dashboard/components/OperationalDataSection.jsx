import React, { useState, useMemo, useCallback } from "react";
import { Row, Col, Button } from "react-bootstrap";
import DataTable from "./shared/dataTable";
import ModalComponent from "/src/components/ModalV2";
import "./OperationalDataSection.css";

const ROW_LIMIT = 10;

const COLUMN_LABELS = {

    order_code: "Código Pedido",
    order_date: "Data do Pedido",
    year_months: "Ano/Mês",

    client_name: "Cliente",
    client_city: "Cidade",
    client_state: "UF",

    supplier_name: "Fornecedor",

    product_name: "Produto",
    product_class_material_name: "Categoria",

    quantity_requested: "Quantidade",
    unit_price: "Valor Unitário",

    total_amount: "Valor Total",
    total_amount_received: "Valor Recebido",
    total_amount_rejection: "Valor Rejeitado",

    item_status: "Status Pedido",

    expected_delivery_date: "Entrega Prevista",
    actual_delivery_date: "Entrega Real",

    delay_days: "Dias de Atraso",

    partial_delivery_flag: "Entrega Parcial",

    sum_total_amount: "Valor Total",
    sum_quantity: "Quantidade",
    count_items: "Itens",
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
    if (!v) return "Desconhecido";
    const s = String(v).toLowerCase().trim().replace(/\s+/g, "_");
    return STATUS_MAP[s] || "Desconhecido";
};

const OperationalDataSection = ({ tabela }) => {
    const [state, setState] = useState({
        expanded: false,
        zoom: 1,
        open: false
    });

    const { expanded, zoom, open } = state;

    const setExpanded = useCallback(
        (v) => setState((s) => ({ ...s, expanded: v })),
        []
    );

    const setZoom = useCallback(
        (updater) =>
            setState((s) => ({
                ...s,
                zoom: typeof updater === "function" ? updater(s.zoom) : updater
            })),
        []
    );

    const setOpen = useCallback(
        (v) => setState((s) => ({ ...s, open: v })),
        []
    );

    const visibleRows = useMemo(() => {
        return expanded ? tabela : tabela.slice(0, ROW_LIMIT);
    }, [expanded, tabela]);

    const columns = useMemo(() => {
        const row = visibleRows[0];
        if (!row) return [];

        return Object.keys(row)
            .filter(k => COLUMN_LABELS[k])
            .map((key) => ({
                key,
                label: COLUMN_LABELS[key] ?? key
            }));
    }, [visibleRows]);

    const rowsFormatted = useMemo(() => {
        return visibleRows.map((row) => ({
            ...row,
            item_status: normalizeStatus(row.item_status)
        }));
    }, [visibleRows]);

    const modalRows = useMemo(() => {
        return tabela.map((row) => ({
            ...row,
            item_status: normalizeStatus(row.item_status)
        }));
    }, [tabela]);

    const applyZoom = useCallback(
        (d) => {
            setZoom((z) => Math.min(1.5, Math.max(0.7, z + d)));
        },
        [setZoom]
    );

    const toggleExpanded = useCallback(() => {
        setExpanded(!expanded);
    }, [expanded, setExpanded]);

    return (
        <div className="operational-section-wrapper">
            <div className="operational-expand-wrapper" onClick={() => setOpen(true)}>
                <div className="chart-pie-expand-btn">
                    <span className="chart-pie-expand-icon">⤢</span>
                </div>
            </div>

            <Row className="mb-0">
                <Col xs={12}>
                    <div className="operational-title-container">
                        <h6 className="operational-title">Tabela Consolidada</h6>

                        <div className="operational-zoom-controls">
                            <button
                                onClick={() => applyZoom(-0.1)}
                                className="operational-zoom-button"
                            >
                                –
                            </button>

                            <button
                                onClick={() => applyZoom(+0.1)}
                                className="operational-zoom-button"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="operational-table-container">
                        <div
                            className="operational-zoom-wrapper"
                            style={{ "--datatable-zoom": zoom }}
                        >
                            <DataTable
                                columns={columns}
                                rows={rowsFormatted}
                                exportRows={modalRows}
                                exportFileName="tabela-operacional"
                                exportTitle="Tabela Consolidada"
                                premium={true}
                            />
                        </div>
                    </div>

                    {tabela.length > ROW_LIMIT && (
                        <div className="text-center mt-2">
                            <Button
                                variant="outline-info"
                                size="sm"
                                onClick={toggleExpanded}
                                className="operational-view-more-button"
                            >
                                {expanded ? "Ver menos" : `Ver todos (${tabela.length})`}
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            <ModalComponent
                title="Tabela Consolidada"
                open={open}
                setOpen={() => setOpen(false)}
                content={
                    <DataTable
                        columns={columns}
                        rows={modalRows}
                        exportRows={modalRows}
                        exportFileName="tabela-operacional"
                        exportTitle="Tabela Consolidada"
                        premium={true}
                    />
                }
            />
        </div>
    );
};

export default React.memo(OperationalDataSection);
