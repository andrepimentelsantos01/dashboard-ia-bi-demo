import React, { useCallback, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import ModalComponent from "/src/components/ModalV2";
import "./ChartMapMorph.css";
import { useChartMapMorphState } from "./chartMapMorph.state";

const chartStyle = { width: "100%", height: "100%" };
const chartOpts = { renderer: "canvas" };

const ChartMapMorph = ({ backendData, onCrossFilter }) => {
    const {
        open,
        setOpen,
        option,
        handleClick,
        handleRefresh,
        handleToggleView,
        viewMode
    } = useChartMapMorphState({
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
            <div className="chart-map-morph-container">
                <button
                    onClick={toggleView}
                    className="chart-map-morph-toggle-btn"
                    title={viewMode === "map" ? "Alternar para ranking" : "Alternar para mapa"}
                    aria-label={viewMode === "map" ? "Alternar para ranking" : "Alternar para mapa"}
                >
                    <span className="chart-map-morph-toggle-glyph">&#8646;</span>
                </button>

                <button onClick={refreshChart} className="chart-map-morph-refresh-btn">
                    <FiRefreshCcw className="chart-map-morph-icon" />
                </button>

                <button onClick={openModal} className="chart-map-morph-expand-btn">
                    <FiMaximize2 className="chart-map-morph-icon" />
                </button>

                <ReactECharts
                    option={option}
                    style={chartStyle}
                    onEvents={events}
                    notMerge
                    lazyUpdate={false}
                    opts={chartOpts}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={
                    open ? (
                        <ReactECharts
                            option={option}
                            style={chartStyle}
                            onEvents={events}
                            notMerge
                            lazyUpdate={false}
                            opts={chartOpts}
                        />
                    ) : null
                }
            />
        </>
    );
};

export default React.memo(ChartMapMorph);