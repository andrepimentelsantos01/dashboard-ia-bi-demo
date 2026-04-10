import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import FilterSection from "./FilterSection";
import KpiSection from "./KpiSection";
import OperationalDataSection from "./OperationalDataSection";
import OverviewSection from "./OverviewSection";
import SectionWrapper from "./SectionWrapper";
import DashboardDateFilterModal from "./DashboardDateFilterModal";

const DashboardTabLayout = ({
    scopeClassName = "bi-scope",
    filters,
    onFilterChange,
    clearFilters,
    clearButtonRef,
    showFloatingClear,
    filterOptions = {},
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
    const filterSectionKey = useMemo(() => {
        const filterSchema = Object.keys(filterOptions).sort().join("|");
        return `${kpiTitle}-${filterSchema}`;
    }, [filterOptions, kpiTitle]);

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
                    hiddenFilterNames={hiddenFilterNames}
                    {...filterOptions}
                />
            </SectionWrapper>

            <SectionWrapper title={kpiTitle} className={contentSectionClassName}>
                <KpiSection
                    kpis={kpis}
                    alertas={alertas}
                    onCrossFilter={onCrossFilter}
                    resetToken={resetToken}
                />
            </SectionWrapper>

            <SectionWrapper title={overviewTitle} className={contentSectionClassName}>
                <OverviewSection
                    charts={charts}
                    key={overviewResetKey ? resetToken : undefined}
                />
            </SectionWrapper>

            <SectionWrapper title={tableTitle} className={contentSectionClassName}>
                <OperationalDataSection tabela={tabela} />
            </SectionWrapper>

            {showFloatingClear ? (
                <Button
                    variant="outline-info"
                    size="sm"
                    onClick={clearFilters}
                    className="floating-clear-button"
                >
                    Limpar
                </Button>
            ) : null}
        </div>
    );
};

export default React.memo(DashboardTabLayout);
