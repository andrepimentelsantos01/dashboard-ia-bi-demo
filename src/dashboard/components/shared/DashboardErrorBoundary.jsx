import React from "react";
import DashboardAsyncState from "./DashboardAsyncState";

class DashboardErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        if (typeof this.props.onError === "function") {
            this.props.onError(error, errorInfo);
        } else {
            console.error(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <DashboardAsyncState
                    variant="error"
                    compact
                    title="Nao foi possivel renderizar esta secao"
                    description="O componente falhou durante a renderizacao e foi isolado para preservar o restante do dashboard."
                />
            );
        }

        return this.props.children;
    }
}

export default DashboardErrorBoundary;
