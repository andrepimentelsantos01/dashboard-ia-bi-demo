import React, { useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import ModalComponent from "/src/components/ModalV2";
import "./ChartHeatmap.css";
import { useChartHeatmapState } from "./chartHeatmap.state";

const chartStyle = { width: "100%", height: "100%" };

const ChartHeatmap = ({
    backendData,
    onCrossFilter
}) => {
    const {
        open,
        setOpen,
        option,
        handleClickCell,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartHeatmapState({
        backendData,
        onCrossFilter
    });

    const refreshChart = useCallback(() => {
        handleRefresh();
        setChartKey((current) => current + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);
    const events = useMemo(() => ({ click: handleClickCell }), [handleClickCell]);

    return (
        <>
            <div className="chart-heatmap-container">
                <button onClick={refreshChart} className="chart-heatmap-refresh-btn">
                    <FiRefreshCcw className="chart-heatmap-icon" />
                </button>

                <button onClick={openModal} className="chart-heatmap-expand-btn">
                    <FiMaximize2 className="chart-heatmap-icon" />
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

export default React.memo(ChartHeatmap);
