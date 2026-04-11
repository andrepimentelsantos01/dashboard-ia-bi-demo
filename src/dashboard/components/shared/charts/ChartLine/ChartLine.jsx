import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import React, { useCallback, useMemo } from "react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import "./ChartLine.css";
import { useChartLineState } from "./chartLine.state";

const chartOpts = { renderer: "canvas" };

const ChartLine = ({
    backendData,
    onCrossFilter,
    currencyCode = "BRL",
    locale = "pt-BR"
}) => {
    const {
        open,
        setOpen,
        option,
        handleClickPoint,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartLineState({
        backendData,
        onCrossFilter,
        currencyCode,
        locale
    });

    const refreshChart = useCallback(() => {
        handleRefresh();
        setChartKey(k => k + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);

    const chartEvents = useMemo(() => ({ click: handleClickPoint }), [handleClickPoint]);

    const chartStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

    return (
        <>
            <div className="chart-line-container">
                <button onClick={refreshChart} className="chart-line-refresh-btn">
                    <FiRefreshCcw className="chart-line-refresh-icon" />
                </button>

                <button onClick={openModal} className="chart-line-expand-btn">
                    <FiMaximize2 className="chart-line-expand-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    style={chartStyle}
                    onEvents={chartEvents}
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
                        key={chartKey}
                        option={option}
                        style={chartStyle}
                        lazyUpdate
                        opts={chartOpts}
                    />
                ) : null}
                isOpenInvoiced={false}
                titleCard=""
            />
        </>
    );
};

export default React.memo(ChartLine);
