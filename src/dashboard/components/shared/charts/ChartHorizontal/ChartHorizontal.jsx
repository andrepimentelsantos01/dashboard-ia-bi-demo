import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import React, { useState, useCallback, useMemo } from "react";
import { FiChevronsDown, FiChevronsUp, FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import "./ChartHorizontal.css";
import { useChartHorizontalState } from "./chartHorizontal.state";

const chartStyle = { width: "100%", height: "100%" };
const chartOpts = { renderer: "canvas" };

const ChartInstance = React.memo(({ option, onEvents }) => (
    <ReactECharts option={option} style={chartStyle} onEvents={onEvents} lazyUpdate opts={chartOpts} />
));

const ChartInstanceStatic = React.memo(({ option }) => (
    <ReactECharts option={option} style={chartStyle} lazyUpdate opts={chartOpts} />
));

const ChartHorizontal = ({
                             data,
                             backendData,
                             color = "#17877e",
                             order = "ASC",
                             onCrossFilter,
                             valueFormat
                         }) => {
    const {
        open,
        setOpen,
        option,
        handleClickBar,
        setOrder,
        orderState,
        handleRefresh
    } = useChartHorizontalState({
        data,
        backendData,
        color,
        order,
        onCrossFilter,
        valueFormat
    });

    const [refreshToken, setRefreshToken] = useState(0);

    const toggleOrder = useCallback(() => {
        setOrder(prev => (prev === "ASC" ? "DESC" : "ASC"));
    }, [setOrder]);

    const refreshChart = useCallback(() => {
        handleRefresh();
        setRefreshToken(t => t + 1);
    }, [handleRefresh]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);

    const chartEvents = useMemo(() => ({ click: handleClickBar }), [handleClickBar]);

    const chartKey = useMemo(() => refreshToken, [refreshToken]);

    return (
        <>
            <div className="chart-horizontal-container">
                <button onClick={toggleOrder} className="chart-horizontal-sort-btn">
                    {orderState === "ASC" ? (
                        <FiChevronsDown className="chart-horizontal-icon" />
                    ) : (
                        <FiChevronsUp className="chart-horizontal-icon" />
                    )}
                </button>

                <button onClick={refreshChart} className="chart-horizontal-refresh-btn">
                    <FiRefreshCcw className="chart-horizontal-icon" />
                </button>

                <button onClick={openModal} className="chart-horizontal-expand-btn">
                    <FiMaximize2 className="chart-horizontal-icon" />
                </button>

                <ChartInstance key={chartKey} option={option} onEvents={chartEvents} />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={
                    open ? (
                        <ChartInstanceStatic key={chartKey} option={option} />
                    ) : null
                }
                isOpenInvoiced={false}
                titleCard=""
            />
        </>
    );
};

export default React.memo(ChartHorizontal);
