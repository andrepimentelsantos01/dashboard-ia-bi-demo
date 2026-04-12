import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import { FiMoon, FiSun } from "react-icons/fi";
import FilterSection from "./FilterSection";
import KpiSection from "./KpiSection";
import OperationalDataSection from "./OperationalDataSection";
import OverviewSection from "./OverviewSection";
import SectionWrapper from "./SectionWrapper";
import DashboardDateFilterModal from "./DashboardDateFilterModal";
import DashboardErrorBoundary from "./shared/DashboardErrorBoundary";
import DashboardAsyncState from "./shared/DashboardAsyncState";
import { useThemeMode } from "../../hooks/useThemeMode";

const DashboardTabLayout = ({
    scopeClassName = "bi-scope",
    filters,
    onFilterChange,
    clearFilters,
    clearButtonRef,
    showFloatingClear,
    filterOptions = {},
    filterInputs,
    hiddenFilterNames = [],
    filterSectionClassName = "filter-section-wrapper filter-body-override",
    contentSectionClassName,
    filterTitle = "Filtros & Segmentação",
    kpiTitle = "KPIs",
    overviewTitle = "Visão Geral",
    tableTitle = "Dados Operacionais",
    kpis = {},
    alertas,
    onCrossFilter,
    resetToken,
    charts = [],
    tabela = [],
    dateModal,
    overviewResetKey = true,
    asyncState
}) => {
    const { isDark, toggleTheme } = useThemeMode();
    const {
        isLoading = false,
        isRefreshing = false,
        error = null,
        hasData = false,
        onRetry
    } = asyncState || {};
    const filterSectionKey = useMemo(() => {
        const filterSchema = Object.keys(filterOptions).sort().join("|");
        const filterInputSchema = (filterInputs || []).map(({ name }) => name).sort().join("|");
        return `${kpiTitle}-${filterSchema}-${filterInputSchema}`;
    }, [filterInputs, filterOptions, kpiTitle]);

    const filterActions = useMemo(() => (
        <Button
            variant="outline-info"
            size="sm"
            onClick={clearFilters}
            ref={clearButtonRef}
            disabled={isLoading || isRefreshing}
        >
            Limpar
        </Button>
    ), [clearButtonRef, clearFilters, isLoading, isRefreshing]);

    return (
        <div className={scopeClassName}>
            {dateModal ? (
                <DashboardDateFilterModal
                    open={dateModal.open}
                    onClose={dateModal.onClose}
                    onClear={dateModal.onClear}
                    onApply={dateModal.onApply}
                    value={dateModal.value}
                    onChange={dateModal.onChange}
                    title={dateModal.title}
                    label={dateModal.label}
                    modalClassName={dateModal.modalClassName}
                />
            ) : null}

            {error && hasData ? (
                <div className="mb-3">
                    <DashboardAsyncState
                        variant="error"
                        compact
                        title="Nao foi possivel atualizar todos os dados"
                        description="O dashboard manteve a ultima visao disponivel. Tente carregar novamente."
                        onAction={onRetry}
                    />
                </div>
            ) : null}

            <SectionWrapper
                className={filterSectionClassName}
                title={filterTitle}
                actions={filterActions}
            >
                <div
                    className={isLoading || isRefreshing ? "dashboard-section-loading" : ""}
                    aria-busy={isLoading || isRefreshing}
                    style={{
                        pointerEvents: isLoading || isRefreshing ? "none" : undefined
                    }}
                >
                    <FilterSection
                        key={filterSectionKey}
                        filters={filters}
                        onChange={onFilterChange}
                        onClear={clearFilters}
                        filterInputs={filterInputs}
                        hiddenFilterNames={hiddenFilterNames}
                        {...filterOptions}
                    />
                </div>
            </SectionWrapper>

            <SectionWrapper title={kpiTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <KpiSection
                        kpis={kpis}
                        alertas={alertas}
                        onCrossFilter={onCrossFilter}
                        resetToken={resetToken}
                        isLoading={isLoading && !hasData}
                        isRefreshing={isRefreshing && hasData}
                        error={error}
                        onRetry={onRetry}
                    />
                </DashboardErrorBoundary>
            </SectionWrapper>

            <SectionWrapper title={overviewTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <OverviewSection
                        charts={charts}
                        key={overviewResetKey ? resetToken : undefined}
                        isLoading={isLoading && !hasData}
                        isRefreshing={isRefreshing && hasData}
                        error={error}
                        onRetry={onRetry}
                    />
                </DashboardErrorBoundary>
            </SectionWrapper>

            <SectionWrapper title={tableTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <OperationalDataSection
                        tabela={tabela}
                        isLoading={isLoading && !hasData}
                        isRefreshing={isRefreshing && hasData}
                        error={error}
                        onRetry={onRetry}
                    />
                </DashboardErrorBoundary>
            </SectionWrapper>

            {showFloatingClear ? (
                <div className="floating-action-stack">
                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={toggleTheme}
                        className="floating-theme-button"
                        disabled={isLoading || isRefreshing}
                        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
                        title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
                    >
                        {isDark ? <FiSun /> : <FiMoon />}
                    </Button>

                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={clearFilters}
                        className="floating-clear-button"
                        disabled={isLoading || isRefreshing}
                    >
                        Limpar
                    </Button>
                </div>
            ) : null}
        </div>
    );
};

export default React.memo(DashboardTabLayout);
