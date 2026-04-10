import React, { useMemo } from "react";
import { Card } from "react-bootstrap";
import "./KpiCard.css";
import { useKpiCardState } from "./kpiCard.state";

const KpiCard = ({ label, value, variation }) => {
    const { isEmpty, formatted } = useKpiCardState(label, value);

    const variationClass = useMemo(() => {
        if (variation > 0) return "variation-up";
        if (variation < 0) return "variation-down";
        return "variation-zero";
    }, [variation]);

    const variationText = useMemo(() => {
        if (variation == null) return null;
        const v = variation.toFixed(1);
        return variation > 0 ? `+${v}%` : `${v}%`;
    }, [variation]);

    const showVariation = variationText !== null;

    return (
        <Card className="kpi-card text-center">
            <div className="kpi-card-overlay" />
            <Card.Body className="kpi-card-body d-flex flex-column justify-content-center">
                <span className="kpi-card-label">{label}</span>
                <span className="kpi-card-value">{isEmpty ? "–" : formatted}</span>
                {/* {showVariation && (
                    <span className={`kpi-card-variation ${variationClass}`}>
                        {variationText}
                    </span>
                )} */}
            </Card.Body>
        </Card>
    );
};

export default React.memo(KpiCard);