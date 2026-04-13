import React, { useState, useMemo, useCallback, useTransition } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { FiMaximize2, FiMinus, FiPlus } from "react-icons/fi";
import DataTable from "./shared/dataTable";
import ModalComponent from "/src/components/ModalV2";
import DashboardAsyncState, {
    DashboardSectionLoadingOverlay,
    DashboardTableSkeleton
} from "./shared/DashboardAsyncState";
import { normalizeStatusLabel } from "../selectors/shared/dashboardStatus";
import "./OperationalDataSection.css";

const ROW_LIMIT = 10;

const COLUMN_LABELS = {
    purchase_order_id: "Pedido",
    shipment_id: "Embarque",
    order_code: "Codigo Pedido",
    order_date: "Data do Pedido",
    shipment_date: "Data do Embarque",
    year_months: "Ano/Mes",
    client_name: "Cliente",
    customer_name: "Cliente",
    customer_location: "Localidade",
    client_city: "Cidade",
    client_state: "UF",
    region: "Regiao",
    supplier_name: "Fornecedor",
    carrier: "Carrier",
    payment_method: "Metodo de Pagamento",
    transaction_type: "Tipo de Transacao",
    time_of_sale: "Turno",
    received_by: "Atendente",
    product_name: "Produto",
    route_name: "Rota",
    product_class_material_name: "Categoria",
    origin_warehouse: "Warehouse Origem",
    destination: "Destino",
    quantity_requested: "Quantidade",
    weight_kg: "Peso (kg)",
    distance_miles: "Distancia (mi)",
    unit_price: "Valor Unitario",
    total_amount: "Valor Total",
    operating_profit: "Lucro Operacional",
    operating_margin_percent: "Margem Operacional (%)",
    total_amount_received: "Valor Recebido",
    total_amount_rejection: "Valor Rejeitado",
    item_status: "Status Pedido",
    sales_method: "Canal de Venda",
    expected_delivery_date: "Entrega Prevista",
    actual_delivery_date: "Entrega Real",
    transit_days: "Prazo Planejado (dias)",
    actual_transit_days: "Transito Real (dias)",
    delay_days: "Dias de Atraso",
    partial_delivery_flag: "Entrega Parcial",
    on_time_flag: "No Prazo",
    delivery_success_flag: "Sucesso na Entrega",
    exception_flag: "Excecao",
    sum_total_amount: "Valor Total",
    sum_quantity: "Quantidade",
    count_items: "Itens",
    classificacaoABC: "Curva ABC",
    classificacaoXYZ: "Curva XYZ",
    abc_classification: "Curva ABC",
    xyz_classification: "Curva XYZ"
};

const normalizeOperationalStatus = (row) =>
    normalizeStatusLabel(
        row?.logistics_status || row?.item_status || row?.order_status || row?.status,
        { fallback: "Desconhecido" }
    );

const mapOperationalRow = (row) => {
    const normalizedStatus = normalizeOperationalStatus(row);

    return {
        ...row,
        logistics_status: normalizedStatus,
        item_status: normalizedStatus,
        order_status: normalizedStatus,
        status: normalizedStatus
    };
};

const COLUMN_PRIORITY = {
    shipment_id: 1,
    purchase_order_id: 1,
    order_date: 1,
    shipment_date: 1,
    expected_delivery_date: 1,
    actual_delivery_date: 1,
    year_months: 1,
    customer_name: 1,
    client_name: 2,
    customer_location: 1,
    client_city: 2,
    client_state: 2,
    region: 2,
    supplier_name: 1,
    carrier: 1,
    payment_method: 1,
    transaction_type: 1,
    time_of_sale: 1,
    received_by: 1,
    product_name: 1,
    route_name: 1,
    product_class_material_name: 1,
    origin_warehouse: 1,
    destination: 1,
    quantity_requested: 1,
    sum_quantity: 2,
    weight_kg: 1,
    distance_miles: 1,
    unit_price: 1,
    avg_unit_price: 2,
    total_amount: 1,
    sum_total_amount: 2,
    operating_profit: 1,
    item_status: 1,
    order_status: 2,
    status: 3,
    sales_method: 1,
    transit_days: 1,
    actual_transit_days: 1,
    delay_days: 1,
    on_time_flag: 1,
    delivery_success_flag: 1,
    exception_flag: 1,
    partial_delivery_flag: 1
};

const OperationalDataSection = ({ tabela = [], isLoading, isRefreshing, error, onRetry }) => {
    const [state, setState] = useState({
        expanded: false,
        zoom: 0.96,
        open: false
    });
    const [isPending, startTransition] = useTransition();

    const { expanded, zoom, open } = state;

    const setExpanded = useCallback(
        (value) => setState((current) => ({ ...current, expanded: value })),
        []
    );

    const setZoom = useCallback(
        (updater) =>
            setState((current) => ({
                ...current,
                zoom: typeof updater === "function" ? updater(current.zoom) : updater
            })),
        []
    );

    const setOpen = useCallback(
        (value) => setState((current) => ({ ...current, open: value })),
        []
    );

    const normalizedTable = useMemo(
        () => tabela.map(mapOperationalRow),
        [tabela]
    );

    const visibleRows = useMemo(
        () => (expanded ? normalizedTable : normalizedTable.slice(0, ROW_LIMIT)),
        [expanded, normalizedTable]
    );

    const columns = useMemo(() => {
        const row = normalizedTable[0];
        if (!row) return [];

        const byLabel = new Map();

        Object.keys(row)
            .filter((key) => COLUMN_LABELS[key])
            .forEach((key) => {
                const label = COLUMN_LABELS[key] ?? key;
                const current = byLabel.get(label);
                const nextPriority = COLUMN_PRIORITY[key] ?? 99;

                if (!current || nextPriority < current.priority) {
                    byLabel.set(label, {
                        key,
                        label,
                        priority: nextPriority
                    });
                }
            });

        return Array.from(byLabel.values())
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                return String(a.label).localeCompare(String(b.label), undefined, {
                    sensitivity: "base"
                });
            })
            .map(({ key, label }) => ({
                key,
                label
            }));
    }, [normalizedTable]);

    const applyZoom = useCallback(
        (delta) => {
            setZoom((value) => Math.min(1.16, Math.max(0.82, Number((value + delta).toFixed(2)))));
        },
        [setZoom]
    );

    const toggleExpanded = useCallback(() => {
        startTransition(() => {
            setExpanded(!expanded);
        });
    }, [expanded, setExpanded, startTransition]);

    if (isLoading) {
        return <DashboardTableSkeleton />;
    }

    if (error && !normalizedTable.length) {
        return (
            <DashboardAsyncState
                variant="error"
                title="Nao foi possivel carregar a tabela"
                description="Os dados operacionais nao puderam ser carregados neste momento. Tente novamente."
                onAction={onRetry}
            />
        );
    }

    if (!normalizedTable.length) {
        return (
            <DashboardAsyncState
                variant="empty"
                title="Nenhum dado operacional encontrado"
                description="Ajuste os filtros para visualizar registros na tabela consolidada."
            />
        );
    }

    return (
        <div className={`operational-section-wrapper ${isRefreshing ? "dashboard-section-loading" : ""}`}>
            {isRefreshing ? <DashboardSectionLoadingOverlay label="Atualizando tabela..." /> : null}
            <Row className="mb-0">
                <Col xs={12}>
                    <div className="operational-title-container">
                        <div className="operational-actions">
                            <div className="operational-zoom-controls">
                                <button
                                    type="button"
                                    onClick={() => applyZoom(-0.04)}
                                    className="operational-zoom-button"
                                    aria-label="Reduzir zoom da tabela"
                                >
                                    <FiMinus />
                                </button>

                                <span className="operational-zoom-indicator">
                                    {Math.round(zoom * 100)}%
                                </span>

                                <button
                                    type="button"
                                    onClick={() => applyZoom(0.04)}
                                    className="operational-zoom-button"
                                    aria-label="Aumentar zoom da tabela"
                                >
                                    <FiPlus />
                                </button>
                            </div>

                            <button
                                type="button"
                                className="operational-expand-button"
                                onClick={() => setOpen(true)}
                                aria-label="Expandir tabela operacional"
                            >
                                <FiMaximize2 />
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
                                rows={visibleRows}
                                exportRows={normalizedTable}
                                exportFileName="tabela-operacional"
                                exportTitle="Tabela Consolidada"
                            />
                        </div>
                    </div>

                    {normalizedTable.length > ROW_LIMIT && (
                        <div className="text-center mt-3">
                            <Button
                                variant="outline-info"
                                size="sm"
                                onClick={toggleExpanded}
                                className="operational-view-more-button"
                                disabled={isPending}
                            >
                                {isPending
                                    ? "Carregando tabela..."
                                    : expanded
                                        ? "Ver menos"
                                        : `Ver todos (${normalizedTable.length})`}
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            <ModalComponent
                title="Tabela Consolidada"
                open={open}
                setOpen={() => setOpen(false)}
                content={open ? (
                    <DataTable
                        columns={columns}
                        rows={normalizedTable}
                        exportRows={normalizedTable}
                        exportFileName="tabela-operacional"
                        exportTitle="Tabela Consolidada"
                    />
                ) : null}
            />
        </div>
    );
};

export default React.memo(OperationalDataSection);
