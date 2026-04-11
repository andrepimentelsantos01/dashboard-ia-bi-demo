import React, { useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import ModalComponent from "/src/components/ModalV2";
import "./ChartScatterAggregate.css";
import { useChartScatterAggregateState } from "./chartScatterAggregate.state";

const chartStyle = { width: "100%", height: "100%" };
const chartOpts = { renderer: "canvas" };

const ChartScatterAggregate = ({ backendData, onCrossFilter }) => {
    const {
        open,
        setOpen,
        option,
        handleClick,
        handleRefresh,
        handleToggleView,
        viewMode
    } = useChartScatterAggregateState({
        backendData,
        onCrossFilter
    });

    const refreshChart = useCallback(() => {
        handleRefresh();
    }, [handleRefresh]);

    const toggleView = useCallback(() => {
        handleToggleView();
    }, [handleToggleView]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);
    const events = useMemo(() => ({ click: handleClick }), [handleClick]);

    return (
        <>
            <div className="chart-scatter-aggregate-container">
                <button
                    onClick={toggleView}
                    className="chart-scatter-aggregate-toggle-btn"
                    title={viewMode === "scatter" ? "Alternar para ranking" : "Alternar para dispersao"}
                    aria-label={viewMode === "scatter" ? "Alternar para ranking" : "Alternar para dispersao"}
                >
                    <span className="chart-scatter-aggregate-toggle-glyph">&#8646;</span>
                </button>

                <button onClick={refreshChart} className="chart-scatter-aggregate-refresh-btn">
                    <FiRefreshCcw className="chart-scatter-aggregate-icon" />
                </button>

                <button onClick={openModal} className="chart-scatter-aggregate-expand-btn">
                    <FiMaximize2 className="chart-scatter-aggregate-icon" />
                </button>

                <ReactECharts
                    option={option}
                    style={chartStyle}
                    onEvents={events}
                    lazyUpdate={false}
                    notMerge={false}
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
                            lazyUpdate={false}
                            notMerge={false}
                            opts={chartOpts}
                        />
                    ) : null
                }
            />
        </>
    );
};

export default React.memo(ChartScatterAggregate);