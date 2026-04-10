import React, { useState, useCallback, useMemo } from "react";
import { Card } from "react-bootstrap";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./SectionWrapper.css";

const SectionWrapper = ({ title, children, actions, style, className }) => {
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => !prev);
    }, []);

    const collapseIcon = useMemo(() => {
        return collapsed ? <FiChevronUp /> : <FiChevronDown />;
    }, [collapsed]);

    return (
        <Card className={`${className || ""} section-wrapper-card`} style={style}>
            <Card.Header
                className="section-wrapper-header"
                style={{
                    padding: 0,
                    marginBottom: collapsed ? 0 : -15
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        padding: "4px 18px"
                    }}
                >
                    <span className="section-wrapper-title">{title}</span>

                    <div style={{ flex: 1 }} />

                    <div className="section-wrapper-actions">
                        <button
                            onClick={toggleCollapsed}
                            className="section-wrapper-collapse-button"
                        >
                            {collapseIcon}
                        </button>
                    </div>
                </div>
            </Card.Header>

            {!collapsed && (
                <Card.Body className="section-wrapper-body">
                    {children}

                    {actions && (
                        <div className="section-wrapper-actions-inner">
                            {actions}
                        </div>
                    )}
                </Card.Body>
            )}
        </Card>
    );
};

export default React.memo(SectionWrapper);