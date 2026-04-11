import React from "react";

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
                <div className="alert alert-warning mb-0" role="alert">
                    Nao foi possivel renderizar esta secao.
                </div>
            );
        }

        return this.props.children;
    }
}

export default DashboardErrorBoundary;
