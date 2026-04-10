import { Card, Row, Col } from "react-bootstrap";
import React, { useMemo } from "react";
import "./OverviewSection.css";

const OverviewSection = ({ charts }) => {
    const hasCharts = Array.isArray(charts) && charts.length > 0;

    const renderedCharts = useMemo(() => {
        if (!hasCharts) return null;

        return charts.map((item) => {
            const isCurva = item.title === "Curva ABC" || item.title === "Curva XYZ" || item.title === "Curva XYZ de Clientes" || item.title === "Curva ABC de Clientes";

            return {
                key: item.title,
                title: item.title,
                height: item.height,
                component: item.component,
                isCurva
            };
        });
    }, [hasCharts, charts]);

    if (!renderedCharts) return null;

    return (
        <Row className="g-3">
            {renderedCharts.map(({ key, title, height, component, isCurva }) => (
                <Col key={key} xs={12} md={6}>
                    {isCurva ? (
                        <div className="overview-curva-wrapper">
                            <h6 className="overview-card-title text-center text-black-50">
                                {title}
                            </h6>

                            <div className="overview-chart-container curva-container">
                                {component}
                            </div>
                        </div>
                    ) : (
                        <Card className="overview-card">
                            <Card.Body className="overview-card-body overview-card-body-fix">
                                <h6 className="overview-card-title text-center text-black-50">
                                    {title}
                                </h6>

                                <div
                                    className="overview-chart-container"
                                    style={{ height: height || 260 }}
                                >
                                    {component}
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            ))}
        </Row>
    );
};

export default React.memo(OverviewSection);
