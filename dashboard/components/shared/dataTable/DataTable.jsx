import React, { useMemo, useCallback, useState } from "react";
import "./DataTable.css";
import { useFormatter } from "../../../hooks/useFormatter";
import { useDataTableState } from "./dataTable.state";

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

const DataTable = ({ columns = [], rows = [] }) => {
    const { autoFormat } = useFormatter();

    const [search, setSearch] = useState("");

    const {
        sortColumn,
        sortDirection,
        sortedRows,
        handleSort
    } = useDataTableState({ columns, rows });

    const handleSortMemo = useCallback(
        (col) => handleSort(col),
        [handleSort]
    );

    const getStatusStyle = useCallback((value) => {
        if (colorMap[value]) {
            return { backgroundColor: colorMap[value], color: "#fff" };
        }
        return "neutral";
    }, []);

    const filteredRows = useMemo(() => {
        if (!search) return sortedRows;
        const term = search.toLowerCase();
        return sortedRows.filter((row) =>
            columns.some((col) => {
                const value = row.original?.[col] ?? row[col];
                return String(value ?? "").toLowerCase().includes(term);
            })
        );
    }, [sortedRows, search, columns]);

    const rowsToRender = useMemo(() => {
        return filteredRows.map((row) => {
            const formatted = {};

            for (const col of columns) {
                const value = row.original?.[col] ?? row[col];
                formatted[col] = autoFormat(col, value);
            }

            return { original: row, formatted };
        });
    }, [filteredRows, columns, autoFormat]);

    return (
        <div className="datatable-wrapper">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="datatable-search-input"
            />
            <table className="datatable-table table table-hover">
                <thead>
                <tr className="datatable-header-row">
                    {columns.map((col) => (
                        <th
                            key={col}
                            className="datatable-header-cell"
                            onClick={() => handleSortMemo(col)}
                        >
                            {col}
                            {sortColumn === col && (
                                <span className="datatable-sort-indicator">
                                        {sortDirection === "asc" ? "▲" : "▼"}
                                    </span>
                            )}
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {rowsToRender.map((row, index) => (
                    <tr
                        key={index}
                        className={`datatable-row ${index % 2 === 0 ? "even" : "odd"}`}
                    >
                        {columns.map((col) => {
                            const cell = row.formatted[col];
                            const isStatus = col.toLowerCase().includes("status");

                            if (!isStatus) {
                                return (
                                    <td key={col} className="datatable-cell">
                                        {cell}
                                    </td>
                                );
                            }

                            const styleOrClass = getStatusStyle(cell);
                            const isColor = typeof styleOrClass === "object";

                            return (
                                <td key={col} className="datatable-cell">
                                    {isColor ? (
                                        <span className="datatable-status" style={styleOrClass}>
                                                {cell}
                                            </span>
                                    ) : (
                                        <span className={`datatable-status ${styleOrClass}`}>
                                                {cell}
                                            </span>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(DataTable);