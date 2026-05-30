import ReactECharts from "echarts-for-react";
import React, { useCallback, useMemo } from "react";
import ModalComponent from "/src/components/ModalV2";
import { FiChevronsLeft, FiChevronsRight, FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import "./ChartBarVertical.css";
import { useChartBarVerticalState } from "./chartBarVertical.state";

const chartStyle = { width: "100%", height: "100%" };
const chartOpts = { renderer: "canvas" };

const ChartBarVertical = ({
                              labels,
                              values,
                              backendData,
                              color,
                              onCrossFilter,
                              valueFormat = "currency",
                              valueLabel = "Valor",
                              filterType = "mes",
                              showTrendLine = true,
                              currencyCode = "BRL",
                              locale = "pt-BR"
                          }) => {
    const {
        open,
        setOpen,
        option,
        handleClickBar,
        handleRefresh,
        orderState,
        toggleOrder,
        chartKey,
        setChartKey
    } = useChartBarVerticalState({
        labels,
        values,
        backendData,
        color,
        onCrossFilter,
        valueFormat,
        valueLabel,
        filterType,
        showTrendLine,
        currencyCode,
        locale
    });

    const onRefresh = useCallback(() => {
        handleRefresh();
        setChartKey(k => k + 1);
    }, [handleRefresh, setChartKey]);

    const onOpen = useCallback(() => {
        setOpen(true);
    }, [setOpen]);

    const closeModal = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    const events = useMemo(() => ({ click: handleClickBar }), [handleClickBar]);

    return (
        <>
            <div className="chart-bar-vertical-container">
                <button onClick={toggleOrder} className="chart-bar-vertical-sort-btn">
                    {orderState === "LTR" ? (
                        <FiChevronsRight className="chart-bar-vertical-sort-icon" />
                    ) : (
                        <FiChevronsLeft className="chart-bar-vertical-sort-icon" />
                    )}
                </button>

                <button onClick={onRefresh} className="chart-bar-vertical-refresh-btn">
                    <FiRefreshCcw className="chart-bar-vertical-refresh-icon" />
                </button>

                <button onClick={onOpen} className="chart-bar-vertical-expand-btn">
                    <FiMaximize2 className="chart-bar-vertical-expand-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    style={chartStyle}
                    className="chart-bar-vertical-chart"
                    onEvents={events}
                    lazyUpdate
                    opts={chartOpts}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={open ? (
                    <ReactECharts
                        option={option}
                        style={chartStyle}
                        className="chart-bar-vertical-chart"
                        lazyUpdate
                        opts={chartOpts}
                    />
                ) : null}
            />
        </>
    );
};

export default React.memo(ChartBarVertical);
