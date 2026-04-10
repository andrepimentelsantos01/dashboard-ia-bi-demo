import React, { useMemo, useCallback, useState } from "react";
import { FiFileText, FiGrid } from "react-icons/fi";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./DataTable.css";
import { useFormatter } from "../../../hooks/useFormatter";
import { useDataTableState } from "./dataTable.state";

const colorMap = {
    Ativo: "#28a745",
    Alterado: "#6f42c1",
    Aprovado: "#20c997",
    Arquivado: "#6c757d",
    Disponivel: "#17a2b8",
    "DisponÃ­vel": "#17a2b8",
    "Aguardando AprovaÃ§Ã£o": "#ffc107",
    "Aguardando Julgamento": "#fd7e14",
    "Aguardando Resposta de Envio Parcial": "#fd7e14",
    "Aguardando QualificaÃ§Ã£o": "#1c466d",
    "Aguardando Envio": "#ffea00",
    "Aguardando Complemento": "#ffc107",
    "Em Recebimento": "#17a2b8",
    Bloqueado: "#dc3545",
    Ocupado: "#fd7e14",
    Cancelado: "#dc3545",
    Fechado: "#6c757d",
    "ConcluÃ­do": "#28a745",
    Entregue: "#28a745",
    Desclassificado: "#6c757d",
    Rascunho: "#adb5bd",
    Habilitado: "#20c997",
    Expirado: "#6c757d",
    Falhou: "#dc3545",
    "Totalmente Enviado": "#28a745",
    "Totalmente Utilizado": "#28a745",
    "Em Progresso": "#17a2b8",
    "Em RevisÃ£o": "#ffc107",
    "Em DistribuiÃ§Ã£o": "#17a2b8",
    "Em Treinamento": "#6610f2",
    "Em TrÃ¢nsito": "#e5700e",
    Inativo: "#6c757d",
    Inabilitado: "#dc3545",
    Integrado: "#055117",
    Convidado: "#17a2b8",
    Faturado: "#20c997",
    "Item Implantado": "#20c997",
    "Em Julgamento": "#fd7e14",
    "Em ManutenÃ§Ã£o": "#ffc107",
    "Em RevisÃ£o Mundimed": "#ffc107",
    "Sem Propostas": "#6c757d",
    "NÃ£o Aprovado": "#dc3545",
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
    "Aguardando AtivaÃ§Ã£o": "#ffc107",
    "Aguardando ExclusÃ£o": "#dc3545",
    "SeparaÃ§Ã£o em Andamento": "#17a2b8",
    Qualificado: "#20c997",
    "Aguardando Empenho": "#ffc107",
    "Ordem de Compra Gerada": "#20c997",
    Cotado: "#17a2b8",
    Rejeitado: "#dc3545",
    Liberado: "#20c997",
    Devolvido: "#fd7e14",
    "Devolvido para CorreÃ§Ã£o": "#fd7e14",
    "Amostra Recebida": "#20c997",
    "Amostra Solicitada": "#ffc107",
    "Amostra Enviada": "#17a2b8",
    Padronizado: "#20c997",
    Suspenso: "#dc3545",
    Encerrado: "#6c757d",
    "Recebido Total": "#28a745",
    "PerÃ­odo de Teste": "#17a2b8",
    "Em Disputa": "#17a2b8",
    "Em AvaliaÃ§Ã£o": "#ffc107",
    "Em HabilitaÃ§Ã£o": "#17a2b8",
    "Em CotaÃ§Ã£o": "#17a2b8",
    Desconhecido: "#15334d"
};

const sanitizeFilePart = (value) =>
    String(value || "exportacao")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

const buildTimestamp = () => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
        "-",
        pad(now.getHours()),
        pad(now.getMinutes())
    ].join("");
};

const DataTable = ({
    columns = [],
    rows = [],
    exportRows,
    exportFileName = "tabela-operacional",
    exportTitle = "Tabela Operacional"
}) => {
    const { autoFormat } = useFormatter();
    const [search, setSearch] = useState("");

    const normalizedColumns = useMemo(
        () => columns.map((column) => ({
            key: column?.key ?? column,
            label: column?.label ?? column
        })),
        [columns]
    );

    const {
        sortColumn,
        sortDirection,
        sortedRows,
        handleSort
    } = useDataTableState({ columns: normalizedColumns, rows });

    const handleSortMemo = useCallback((columnKey) => {
        handleSort(columnKey);
    }, [handleSort]);

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
            normalizedColumns.some((column) => {
                const value = row.original?.[column.key] ?? row[column.key];
                return String(value ?? "").toLowerCase().includes(term);
            })
        );
    }, [normalizedColumns, search, sortedRows]);

    const rowsForExportSource = useMemo(
        () => (Array.isArray(exportRows) && exportRows.length ? exportRows : filteredRows),
        [exportRows, filteredRows]
    );

    const rowsToRender = useMemo(() => (
        filteredRows.map((row) => {
            const formatted = {};

            normalizedColumns.forEach((column) => {
                const value = row.original?.[column.key] ?? row[column.key];
                formatted[column.key] = autoFormat(column.key, value);
            });

            return { original: row, formatted };
        })
    ), [autoFormat, filteredRows, normalizedColumns]);

    const exportDataset = useMemo(() => (
        rowsForExportSource.map((row) => {
            const formattedRow = {};

            normalizedColumns.forEach((column) => {
                const value = row.original?.[column.key] ?? row[column.key];
                formattedRow[column.label] = autoFormat(column.key, value);
            });

            return formattedRow;
        })
    ), [autoFormat, normalizedColumns, rowsForExportSource]);

    const exportBaseName = useMemo(
        () => `${sanitizeFilePart(exportFileName)}-${buildTimestamp()}`,
        [exportFileName]
    );

    const handleExportSpreadsheet = useCallback(() => {
        if (!exportDataset.length) return;

        const header = normalizedColumns.map((column) => column.label);
        const worksheet = utils.json_to_sheet(exportDataset, { header });
        const workbook = utils.book_new();

        utils.book_append_sheet(workbook, worksheet, "Dados");
        writeFile(workbook, `${exportBaseName}.xlsx`);
    }, [exportBaseName, exportDataset, normalizedColumns]);

    const handleExportPdf = useCallback(() => {
        if (!exportDataset.length) return;

        const document = new jsPDF({
            orientation: normalizedColumns.length > 6 ? "landscape" : "portrait",
            unit: "pt",
            format: "a4"
        });

        document.setFontSize(14);
        document.text(exportTitle, 40, 36);

        autoTable(document, {
            startY: 52,
            head: [normalizedColumns.map((column) => column.label)],
            body: exportDataset.map((row) =>
                normalizedColumns.map((column) => row[column.label] ?? "")
            ),
            styles: {
                fontSize: 8,
                cellPadding: 6,
                overflow: "linebreak"
            },
            headStyles: {
                fillColor: [55, 90, 127],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            },
            alternateRowStyles: {
                fillColor: [247, 247, 247]
            },
            margin: { top: 52, right: 30, bottom: 30, left: 30 }
        });

        document.save(`${exportBaseName}.pdf`);
    }, [exportBaseName, exportDataset, exportTitle, normalizedColumns]);

    return (
        <div className="datatable-wrapper">
            <div className="datatable-toolbar">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar..."
                    className="datatable-search-input"
                />

                <div className="datatable-toolbar-actions">
                    <button
                        type="button"
                        onClick={handleExportSpreadsheet}
                        className="datatable-export-button datatable-export-button--sheet"
                    >
                        <FiGrid />
                        <span>Planilha</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportPdf}
                        className="datatable-export-button datatable-export-button--pdf"
                    >
                        <FiFileText />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            <table className="datatable-table table table-hover">
                <thead>
                    <tr className="datatable-header-row">
                        {normalizedColumns.map((column) => (
                            <th
                                key={column.key}
                                className="datatable-header-cell"
                                onClick={() => handleSortMemo(column.key)}
                            >
                                {column.label}
                                {sortColumn === column.key && (
                                    <span className="datatable-sort-indicator">
                                        {sortDirection === "asc" ? "â–²" : "â–¼"}
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
                            {normalizedColumns.map((column) => {
                                const cell = row.formatted[column.key];
                                const isStatus = column.key.toLowerCase().includes("status");

                                if (!isStatus) {
                                    return (
                                        <td key={column.key} className="datatable-cell">
                                            {cell}
                                        </td>
                                    );
                                }

                                const styleOrClass = getStatusStyle(cell);
                                const isColor = typeof styleOrClass === "object";

                                return (
                                    <td key={column.key} className="datatable-cell">
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
