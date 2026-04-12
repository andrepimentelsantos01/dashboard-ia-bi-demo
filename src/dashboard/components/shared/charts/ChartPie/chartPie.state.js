import { useState, useMemo, useEffect, useCallback } from "react";

export const useChartPieState = ({ data, backendData, onVisualFilter, onCrossFilter, filterType, categoryField = "categoria" }) => {
    const dispatch = onCrossFilter || onVisualFilter;
    const typeToUse = filterType || "categoria";

    const [open, setOpen] = useState(false);
    const [selectedName, setSelectedName] = useState(null);
    const [chartKey, setChartKey] = useState(0);

    const handleRefresh = useCallback(() => {
        setSelectedName(null);
        if (dispatch) dispatch({ type: "reset" });
    }, [dispatch]);

    useEffect(() => {
        setSelectedName(null);
    }, [data, backendData]);

    const cleanedData = useMemo(() => data || [], [data]);

    const metadataByCategory = useMemo(() => {
        const out = {};
        for (const r of backendData || []) {
            const c = r[categoryField];
            if (!c) continue;
            if (!out[c]) out[c] = [];
            out[c].push(r);
        }
        return out;
    }, [backendData, categoryField]);

    const filteredData = useMemo(() => {
        if (!selectedName) return cleanedData;
        return cleanedData.filter(i => i.name === selectedName);
    }, [cleanedData, selectedName]);

    const clickReset = useCallback(() => {
        setSelectedName(null);
        if (dispatch) dispatch({ type: "reset", reset: true });
    }, [dispatch]);

    const applyFilter = useCallback((name) => {
        setSelectedName(name);
        if (dispatch) dispatch({ type: typeToUse, value: name });
    }, [dispatch, typeToUse]);

    const handleClick = useCallback(
        (params) => {
            const name = params?.name;
            if (!name) return;
            const isSame = filteredData.length === 1 && filteredData[0].name === name;
            if (isSame) {
                clickReset();
                return;
            }
            applyFilter(name);
        },
        [filteredData, clickReset, applyFilter]
    );

    const handleLegendClick = useCallback(
        (params, chart) => {
            const name = params?.name;
            if (!name) return;

            const allSelected = {};
            for (const item of cleanedData) allSelected[item.name] = true;

            chart.setOption({ legend: { selected: allSelected } });

            const isSame = filteredData.length === 1 && filteredData[0].name === name;
            if (isSame) {
                clickReset();
                return;
            }
            applyFilter(name);
        },
        [cleanedData, filteredData, clickReset, applyFilter]
    );

    return {
        open,
        setOpen,
        cleanedData,
        filteredData,
        handleClick,
        handleLegendClick,
        metadataByCategory,
        handleRefresh,
        chartKey,
        setChartKey
    };
};
