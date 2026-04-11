import React, { useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import ModalComponent from "/src/components/ModalV2";
import "./ChartStackedBar.css";
import { useChartStackedBarState } from "./chartStackedBar.state";

const chartStyle = { width: "100%", height: "100%" };

const ChartStackedBar = ({
    backendData,
    onCrossFilter,
    metric = "quantity"
}) => {
    const {
        open,
        setOpen,
        option,
        handleClickSegment,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartStackedBarState({
        backendData,
        onCrossFilter,
        metric
    });

    const refreshChart = useCallback(() => {
        handleRefresh();
        setChartKey((current) => current + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);
    const events = useMemo(() => ({ click: handleClickSegment }), [handleClickSegment]);

    return (
        <>
            <div className="chart-stacked-bar-container">
                <button onClick={refreshChart} className="chart-stacked-bar-refresh-btn">
                    <FiRefreshCcw className="chart-stacked-bar-icon" />
                </button>

                <button onClick={openModal} className="chart-stacked-bar-expand-btn">
                    <FiMaximize2 className="chart-stacked-bar-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    style={chartStyle}
                    onEvents={events}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={<ReactECharts key={chartKey} option={option} style={chartStyle} />}
            />
        </>
    );
};

export default React.memo(ChartStackedBar);
