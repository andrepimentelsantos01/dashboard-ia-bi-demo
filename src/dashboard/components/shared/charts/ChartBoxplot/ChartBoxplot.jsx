import React, { useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { FiMaximize2, FiRefreshCcw } from "react-icons/fi";
import ModalComponent from "/src/components/ModalV2";
import { useChartBoxplotState } from "./chartBoxplot.state";
import "./ChartBoxplot.css";

const chartStyle = { width: "100%", height: "100%" };
const chartOpts = { renderer: "canvas" };

const ChartBoxplot = ({
    backendData,
    categoryField = "produto",
    valueField = "valorTotal",
    idField,
    filterType = "produto",
    maxCategories = 8,
    valueFormat = "currency",
    currencyCode = "BRL",
    locale = "pt-BR",
    onCrossFilter
}) => {
    const {
        open,
        setOpen,
        option,
        handleClick,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartBoxplotState({
        backendData,
        categoryField,
        valueField,
        idField,
        filterType,
        maxCategories,
        valueFormat,
        currencyCode,
        locale,
        onCrossFilter
    });

    const onRefresh = useCallback(() => {
        handleRefresh();
        setChartKey((current) => current + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);
    const events = useMemo(() => ({ click: handleClick }), [handleClick]);

    return (
        <>
            <div className="chart-boxplot-container">
                <button onClick={onRefresh} className="chart-boxplot-refresh-btn">
                    <FiRefreshCcw className="chart-boxplot-icon" />
                </button>

                <button onClick={openModal} className="chart-boxplot-expand-btn">
                    <FiMaximize2 className="chart-boxplot-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    style={chartStyle}
                    onEvents={events}
                    lazyUpdate
                    opts={chartOpts}
                />
            </div>

            <ModalComponent
                title="Visualizacao Ampliada"
                open={open}
                setOpen={closeModal}
                content={
                    open ? (
                        <ReactECharts
                            option={option}
                            style={chartStyle}
                            onEvents={events}
                            lazyUpdate
                            opts={chartOpts}
                        />
                    ) : null
                }
            />
        </>
    );
};

export default React.memo(ChartBoxplot);
