import React from "react";
import { Button } from "react-bootstrap";
import { FiAlertCircle, FiInbox, FiLoader, FiRefreshCw } from "react-icons/fi";
import "./DashboardAsyncState.css";

export const DashboardAsyncState = ({
    variant = "loading",
    title,
    description,
    actionLabel = "Tentar novamente",
    onAction,
    compact = false
}) => {
    const icon = variant === "error"
        ? <FiAlertCircle />
        : variant === "empty"
            ? <FiInbox />
            : <FiLoader className="dashboard-async-state__spinner" />;

    return (
        <div
            className={`dashboard-async-state dashboard-async-state--${variant} ${compact ? "dashboard-async-state--compact" : ""}`}
            role={variant === "error" ? "alert" : "status"}
            aria-live="polite"
        >
            <div className="dashboard-async-state__icon">{icon}</div>
            <h6 className="dashboard-async-state__title">{title}</h6>
            {description ? (
                <p className="dashboard-async-state__description">{description}</p>
            ) : null}
            {variant === "error" && typeof onAction === "function" ? (
                <Button
                    variant="outline-info"
                    size="sm"
                    onClick={onAction}
                    className="dashboard-async-state__action"
                >
                    {actionLabel}
                </Button>
            ) : null}
        </div>
    );
};

export const DashboardSectionLoadingOverlay = ({ label = "Atualizando dados..." }) => (
    <div className="dashboard-section-loading__veil" aria-hidden="true">
        <div className="dashboard-section-loading__pill">
            <FiRefreshCw />
            <span>{label}</span>
        </div>
    </div>
);

export const DashboardKpiSkeleton = () => (
    <div className="dashboard-kpi-skeleton-grid dashboard-skeleton" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="dashboard-kpi-skeleton-card">
                <div className="dashboard-skeleton-block" />
                <div className="dashboard-skeleton-block" />
                <div className="dashboard-skeleton-block" />
            </div>
        ))}
    </div>
);

export const DashboardOverviewSkeleton = ({ count = 4 }) => (
    <div className="dashboard-overview-skeleton-grid dashboard-skeleton" aria-hidden="true">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="dashboard-overview-skeleton-card">
                <div className="dashboard-skeleton-block" />
                <div className="dashboard-skeleton-block" />
            </div>
        ))}
    </div>
);

export const DashboardTableSkeleton = () => (
    <div className="dashboard-table-skeleton dashboard-skeleton" aria-hidden="true">
        <div className="dashboard-table-skeleton__toolbar">
            <div className="dashboard-skeleton-block" />
            <div className="dashboard-skeleton-block" />
        </div>
        <div className="dashboard-table-skeleton__header">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="dashboard-skeleton-block" />
            ))}
        </div>
        <div className="dashboard-table-skeleton__body">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
                <div key={rowIndex} className="dashboard-table-skeleton__row">
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                        <div key={colIndex} className="dashboard-skeleton-block" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export default React.memo(DashboardAsyncState);
