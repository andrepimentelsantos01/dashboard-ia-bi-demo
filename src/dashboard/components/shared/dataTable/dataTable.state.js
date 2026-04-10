import { useState, useMemo, useCallback, useEffect } from "react";

const tokenCache = new Map();

const tokenize = (v) => {
    if (tokenCache.has(v)) return tokenCache.get(v);
    const t = v.split(/(\d+)/).map((t) =>
        /\d+/.test(t) ? Number(t) : t.toLowerCase()
    );
    tokenCache.set(v, t);
    return t;
};

const smartCompare = (a, b) => {
    const strA = a == null ? "" : String(a);
    const strB = b == null ? "" : String(b);
    const tokensA = tokenize(strA);
    const tokensB = tokenize(strB);
    const len = Math.max(tokensA.length, tokensB.length);
    for (let i = 0; i < len; i++) {
        const ta = tokensA[i];
        const tb = tokensB[i];
        if (ta === undefined) return -1;
        if (tb === undefined) return 1;
        const taNum = typeof ta === "number";
        const tbNum = typeof tb === "number";
        if (taNum && tbNum) {
            if (ta !== tb) return ta - tb;
        } else if (taNum && !tbNum) {
            return -1;
        } else if (!taNum && tbNum) {
            return 1;
        } else {
            const r = ta.localeCompare(tb);
            if (r !== 0) return r;
        }
    }
    return 0;
};

export const useDataTableState = ({ columns = [], rows = [] }) => {
    const initialColumn = columns[0]?.key ?? columns[0] ?? null;

    const [state, setState] = useState({
        sortColumn: initialColumn,
        sortDirection: "asc"
    });

    useEffect(() => {
        const columnKeys = columns.map((column) => column?.key ?? column);

        if (state.sortColumn && !columnKeys.includes(state.sortColumn)) {
            setState((prev) => ({
                ...prev,
                sortColumn: columns[0]?.key ?? columns[0] ?? null,
                sortDirection: "asc"
            }));
        }
    }, [columns, state.sortColumn]);

    const handleSort = useCallback((col) => {
        setState((prev) => {
            if (prev.sortColumn === col) {
                return {
                    sortColumn: col,
                    sortDirection: prev.sortDirection === "asc" ? "desc" : "asc"
                };
            }
            return { sortColumn: col, sortDirection: "asc" };
        });
    }, []);

    const compareFn = useCallback(
        (a, b) => {
            const x = a[state.sortColumn] ?? "";
            const y = b[state.sortColumn] ?? "";
            const r = smartCompare(x, y);
            return state.sortDirection === "asc" ? r : -r;
        },
        [state.sortColumn, state.sortDirection]
    );

    const sortedRows = useMemo(() => {
        if (!state.sortColumn) return rows;
        if (rows.length <= 1) return rows;
        return rows.slice().sort(compareFn);
    }, [rows, state.sortColumn, state.sortDirection, compareFn]);

    return {
        sortColumn: state.sortColumn,
        sortDirection: state.sortDirection,
        sortedRows,
        handleSort
    };
};
