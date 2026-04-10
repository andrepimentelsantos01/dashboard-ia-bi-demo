import React, { useMemo, useCallback } from "react";
import { Row, Col } from "react-bootstrap";
import MultiSelectInput from "./MultiSelectInput";
import DateRangePicker from "./DateRangePicker";
import { useFilterSectionOptions } from "../hooks/useFilterSectionOptions";
import "./FilterSection.css";

const FilterSection = ({
                           filters,
                           onChange,
                           fornecedores,
                           clientes,
                           categorias,
                           produtos,
                           orders,
                           numeroCotacao,
                           hiddenFilterNames = []
                       }) => {
    const filterInputs = useFilterSectionOptions(
        fornecedores,
        clientes,
        categorias,
        produtos,
        orders,
        numeroCotacao
    );

    const visibleFilterInputs = useMemo(
        () => filterInputs.filter(({ name }) => !hiddenFilterNames.includes(name)),
        [filterInputs, hiddenFilterNames]
    );

    const handleSelectChange = useCallback(
        name => ({ target }) => onChange(name, target.value),
        [onChange]
    );

    const renderedInputs = useMemo(
        () =>
            visibleFilterInputs.map(({ label, name, data }) => (
                <Col xs={12} md={3} key={name} className="filter-col">
                    <div className="filter-section-card">
                        <MultiSelectInput
                            label={label}
                            name={name}
                            value={filters[name]}
                            data={data}
                            onChange={handleSelectChange(name)}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                </Col>
            )),
        [visibleFilterInputs, filters, handleSelectChange]
    );

    const dateFilter = (
        <Col xs={12} md={3} className="filter-col">
            <div className="filter-section-card">
                <DateRangePicker
                    label="Período"
                    name="dateRange"
                    value={filters.dateRange}
                    onChange={({ target }) => onChange("dateRange", target.value)}
                />
            </div>
        </Col>
    );

    return (
        <Row className="filter-section-row">
            {renderedInputs}
            {dateFilter}
        </Row>
    );
};

export default React.memo(FilterSection);
