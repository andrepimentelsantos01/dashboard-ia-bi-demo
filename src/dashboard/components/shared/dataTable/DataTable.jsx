import React, { useMemo, useCallback, useState, useDeferredValue } from "react";
import { FiFileText, FiGrid, FiSearch } from "react-icons/fi";
import "./DataTable.css";
import { useFormatter } from "../../../hooks/useFormatter";
import { useDataTableState } from "./dataTable.state";
import { normalizeStatusLabel, STATUS_COLOR_MAP } from "../../../selectors/shared/dashboardStatus";

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

const getRowStatusValue = (row = {}, columnKey = "") => {
    if (columnKey === "item_status" || columnKey === "order_status" || columnKey === "status") {
        return row.logistics_status || row.item_status || row.order_status || row.status;
    }

    return row[columnKey];
};

const isDateColumn = (column) => {
    const key = String(column.key || "").toLowerCase();
    const label = String(column.label || "").toLowerCase();

    return key.includes("date")
        || key === "data"
        || label.includes("data");
};

const formatHumanDate = (value) => {
    if (!value) return value;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const hasTime =
        date.getHours() !== 0
        || date.getMinutes() !== 0
        || date.getSeconds() !== 0;

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(hasTime
            ? {
                hour: "2-digit",
                minute: "2-digit"
            }
            : {})
    }).format(date);
};

const formatCellValue = ({ column, row, autoFormat }) => {
    const rawValue = getRowStatusValue(row.original ?? row, column.key);
    const currencyCode = row.original?.currency_code ?? row.currency_code ?? "BRL";
    const locale = currencyCode === "USD" ? "en-US" : "pt-BR";

    if (isDateColumn(column)) {
        return formatHumanDate(rawValue);
    }

    if (column.key.toLowerCase().includes("status")) {
        return normalizeStatusLabel(rawValue, { fallback: "Desconhecido" });
    }

    if (column.key === "unit_price" || column.label === "Valor Unitário") {
        const numeric = typeof rawValue === "number" ? rawValue : Number(String(rawValue ?? "").replace(",", "."));

        if (Number.isFinite(numeric)) {
            return numeric.toLocaleString(locale, {
                style: "currency",
                currency: currencyCode
            });
        }
    }

    return autoFormat(column.label || column.key, row.original?.[column.key] ?? row[column.key], row.original ?? row);
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
    const deferredSearch = useDeferredValue(search);

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

    const filteredRows = useMemo(() => {
        if (!deferredSearch) return sortedRows;

        const term = deferredSearch.toLowerCase();

        return sortedRows.filter((row) =>
            normalizedColumns.some((column) => {
                const displayValue = formatCellValue({
                    column,
                    row,
                    autoFormat
                });

                return String(displayValue ?? "").toLowerCase().includes(term);
            })
        );
    }, [autoFormat, deferredSearch, normalizedColumns, sortedRows]);

    const rowsForExportSource = useMemo(
        () => (Array.isArray(exportRows) && exportRows.length ? exportRows : filteredRows),
        [exportRows, filteredRows]
    );

    const rowsToRender = useMemo(() => (
        filteredRows.map((row) => {
            const formatted = {};

            normalizedColumns.forEach((column) => {
                formatted[column.key] = formatCellValue({
                    column,
                    row,
                    autoFormat
                });
            });

            return { original: row, formatted };
        })
    ), [autoFormat, filteredRows, normalizedColumns]);

    const buildExportDataset = useCallback(
        (sourceRows) =>
            sourceRows.map((row) => {
            const formattedRow = {};

            normalizedColumns.forEach((column) => {
                formattedRow[column.label] = formatCellValue({
                    column,
                    row,
                    autoFormat
                });
            });

            return formattedRow;
            }),
        [autoFormat, normalizedColumns]
    );

    const exportBaseName = useMemo(
        () => `${sanitizeFilePart(exportFileName)}-${buildTimestamp()}`,
        [exportFileName]
    );

    const handleExportSpreadsheet = useCallback(async () => {
        const exportDataset = buildExportDataset(rowsForExportSource);
        if (!exportDataset.length) return;

        const { utils, writeFile } = await import("xlsx");

        const header = normalizedColumns.map((column) => column.label);
        const worksheet = utils.json_to_sheet(exportDataset, { header });
        const workbook = utils.book_new();

        utils.book_append_sheet(workbook, worksheet, "Dados");
        writeFile(workbook, `${exportBaseName}.xlsx`);
    }, [buildExportDataset, exportBaseName, normalizedColumns, rowsForExportSource]);

    const handleExportPdf = useCallback(async () => {
        const exportDataset = buildExportDataset(rowsForExportSource);
        if (!exportDataset.length) return;

        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable")
        ]);

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
    }, [buildExportDataset, exportBaseName, exportTitle, normalizedColumns, rowsForExportSource]);

    return (
        <div className="datatable-wrapper">
            <div className="datatable-toolbar">
                <label className="datatable-search-shell">
                    <FiSearch className="datatable-search-icon" />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar..."
                        className="datatable-search-input"
                    />
                </label>

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

            <div className="datatable-table-shell">
                <table className="datatable-table">
                    <thead>
                        <tr className="datatable-header-row">
                            {normalizedColumns.map((column) => (
                                <th
                                    key={column.key}
                                    className="datatable-header-cell"
                                    onClick={() => handleSortMemo(column.key)}
                                >
                                    <span>{column.label}</span>
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
                        {rowsToRender.length ? rowsToRender.map((row, index) => (
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

                                    const badgeColor = STATUS_COLOR_MAP[cell] || STATUS_COLOR_MAP.Desconhecido;

                                    return (
                                        <td key={column.key} className="datatable-cell datatable-cell--status">
                                            <span
                                                className="datatable-status"
                                                style={{ backgroundColor: badgeColor }}
                                            >
                                                {cell}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        )) : (
                            <tr className="datatable-empty-row">
                                <td className="datatable-empty-cell" colSpan={normalizedColumns.length || 1}>
                                    Nenhum registro encontrado para os filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default React.memo(DataTable);
