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
    overviewResetKey = true
}) => {
    const { isDark, toggleTheme } = useThemeMode();
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
        >
            Limpar
        </Button>
    ), [clearButtonRef, clearFilters]);

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

            <SectionWrapper
                className={filterSectionClassName}
                title={filterTitle}
                actions={filterActions}
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
            </SectionWrapper>

            <SectionWrapper title={kpiTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <KpiSection
                        kpis={kpis}
                        alertas={alertas}
                        onCrossFilter={onCrossFilter}
                        resetToken={resetToken}
                    />
                </DashboardErrorBoundary>
            </SectionWrapper>

            <SectionWrapper title={overviewTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <OverviewSection
                        charts={charts}
                        key={overviewResetKey ? resetToken : undefined}
                    />
                </DashboardErrorBoundary>
            </SectionWrapper>

            <SectionWrapper title={tableTitle} className={contentSectionClassName}>
                <DashboardErrorBoundary>
                    <OperationalDataSection tabela={tabela} />
                </DashboardErrorBoundary>
            </SectionWrapper>

            {showFloatingClear ? (
                <div className="floating-action-stack">
                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={toggleTheme}
                        className="floating-theme-button"
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
                    >
                        Limpar
                    </Button>
                </div>
            ) : null}
        </div>
    );
};

export default React.memo(DashboardTabLayout);
