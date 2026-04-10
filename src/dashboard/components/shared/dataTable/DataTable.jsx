import React, { useMemo, useCallback, useState } from "react";
import { FiFileText, FiGrid } from "react-icons/fi";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./DataTable.css";
import { useFormatter } from "../../../hooks/useFormatter";
import { useDataTableState } from "./dataTable.state";

const colorMap = {
    Ativo: "#0f4f4c",
    Alterado: "#12635e",
    Aprovado: "#177972",
    Arquivado: "#93a9a6",
    Disponivel: "#1b8f86",
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
    "Concluído": "#177972",
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
    Desconhecido: "#0f4f4c"
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
                fillColor: [15, 79, 76],
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
