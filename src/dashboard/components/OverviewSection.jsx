import { Card, Row, Col } from "react-bootstrap";
import React, { useMemo } from "react";
import "./OverviewSection.css";

const ChartHelpTooltip = ({ title, caption }) => {
    if (!caption) return null;

    return (
        <div className="overview-chart-help">
            <button
                type="button"
                className="overview-chart-help-button"
                aria-label={`Ajuda sobre ${title || "este grafico"}`}
            >
                ?
            </button>
            <div className="overview-chart-help-tooltip" role="tooltip">
                {caption}
            </div>
        </div>
    );
};

const OverviewSection = ({ charts }) => {
    const hasCharts = Array.isArray(charts) && charts.length > 0;

    const renderedCharts = useMemo(() => {
        if (!hasCharts) return null;

        return charts.map((item) => {
            const isCurva =
                item.compactLayout ||
                item.title === "Curva ABC" ||
                item.title === "Curva XYZ" ||
                item.title === "Curva XYZ de Clientes" ||
                item.title === "Curva ABC de Clientes";

            return {
                key: item.title,
                title: item.title,
                height: item.height,
                component: item.component,
                caption: item.caption,
                isCurva,
                fullWidth: Boolean(item.fullWidth),
                compactLayout: Boolean(item.compactLayout)
            };
        });
    }, [hasCharts, charts]);

    if (!renderedCharts) return null;

    const compactCharts = renderedCharts.filter((item) => item.compactLayout);
    const regularCharts = renderedCharts.filter((item) => !item.compactLayout);

    return (
        <>
            {compactCharts.length ? (
                <Row className="overview-compact-row">
                    {compactCharts.map(({ key, title, component, caption, fullWidth }) => (
                        <Col key={key} xs={12} md={fullWidth ? 12 : 6} className="overview-grid-col">
                            <div className="overview-curva-wrapper overview-curva-wrapper--compact">
                                {title ? (
                                    <h6 className="overview-card-title overview-card-title--center">
                                        {title}
                                    </h6>
                                ) : null}

                                <div className="overview-chart-container curva-container overview-chart-container--compact">
                                    {component}
                                    <ChartHelpTooltip title={title} caption={caption} />
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            ) : null}

            <Row className="overview-grid-row">
                {regularCharts.map(({ key, title, height, component, caption, isCurva, fullWidth }) => (
                    <Col key={key} xs={12} md={fullWidth ? 12 : 6} className="overview-grid-col">
                        {isCurva ? (
                            <div className="overview-curva-wrapper overview-curva-wrapper--compact">
                                {title ? (
                                    <h6 className="overview-card-title overview-card-title--center">
                                        {title}
                                    </h6>
                                ) : null}

                                <div className="overview-chart-container curva-container">
                                    {component}
                                    <ChartHelpTooltip title={title} caption={caption} />
                                </div>
                            </div>
                        ) : (
                            <Card className="overview-card">
                                <Card.Body className="overview-card-body overview-card-body-fix">
                                    <h6 className="overview-card-title overview-card-title--center">
                                        {title}
                                    </h6>

                                    <div
                                        className="overview-chart-container"
                                        style={{ height: height || 260 }}
                                    >
                                        {component}
                                        <ChartHelpTooltip title={title} caption={caption} />
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                ))}
            </Row>
        </>
    );
};

export default React.memo(OverviewSection);
