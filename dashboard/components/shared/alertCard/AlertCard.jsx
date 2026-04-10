import { Card } from "react-bootstrap";
import React, { useMemo } from "react";
import "./AlertCard.css";
import { useAlertCardState } from "./alertCard.state";

const AlertCard = ({ label, value, onCrossFilter }) => {
    const { isActive, config: { color }, activeColor, handleClick } = useAlertCardState(label, onCrossFilter);

    const backgroundStyle = useMemo(
        () => ({ background: isActive ? activeColor : color }),
        [isActive, activeColor, color]
    );

    const cardClass = useMemo(
        () => (isActive ? "alert-card active" : "alert-card"),
        [isActive]
    );

    return (
        <Card className={cardClass} style={backgroundStyle} onClick={handleClick}>
            <div className="alert-card-overlay" />

            <div className="alert-card-content">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    fill="rgba(255,255,255,0.95)"
                    viewBox="0 0 16 16"
                    className="alert-card-icon"
                >
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 8 4zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>

                <span className="alert-card-label">
                    {label}: {value}
                </span>
            </div>
        </Card>
    );
};

export default React.memo(AlertCard);
