import ReactECharts from "echarts-for-react";
import ModalComponent from "/src/components/ModalV2";
import brasilMap from "/src/dashboard/mocks/brasil.geo.json";
import * as echarts from "echarts";
import React, { useCallback, useMemo } from "react";
import { FiRefreshCcw, FiMaximize2 } from "react-icons/fi";
import "./ChartMap.css";
import { useChartMapState } from "./chartMap.state";

echarts.registerMap("brazil", brasilMap);

const ChartMap = ({ backendData, onCrossFilter }) => {
    const {
        open,
        setOpen,
        option,
        handleClickUF,
        handleRefresh,
        chartKey,
        setChartKey
    } = useChartMapState({
        backendData,
        onCrossFilter
    });

    const refreshChart = useCallback(() => {
        handleRefresh();
        setChartKey(k => k + 1);
    }, [handleRefresh, setChartKey]);

    const openModal = useCallback(() => setOpen(true), [setOpen]);
    const closeModal = useCallback(() => setOpen(false), [setOpen]);

    const chartEvents = useMemo(() => ({ click: handleClickUF }), [handleClickUF]);

    const chartStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);

    return (
        <>
            <div className="chart-map-container">
                <button onClick={refreshChart} className="chart-map-refresh-btn">
                    <FiRefreshCcw className="chart-map-refresh-icon" />
                </button>

                <button onClick={openModal} className="chart-map-expand-btn">
                    <FiMaximize2 className="chart-map-expand-icon" />
                </button>

                <ReactECharts
                    key={chartKey}
                    option={option}
                    style={chartStyle}
                    onEvents={chartEvents}
                />
            </div>

            <ModalComponent
                title="Visualização Ampliada"
                open={open}
                setOpen={closeModal}
                content={
                    <ReactECharts
                        key={chartKey}
                        option={option}
                        style={chartStyle}
                    />
                }
                isOpenInvoiced={false}
                titleCard=""
            />
        </>
    );
};

export default React.memo(ChartMap);
