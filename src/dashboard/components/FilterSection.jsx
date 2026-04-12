import React, { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
    status,
    filterInputs,
    dateFilterPlacement = "end",
    hiddenFilterNames = []
}) => {
    const scrollRef = useRef(null);
    const [scrollState, setScrollState] = useState({
        canScrollLeft: false,
        canScrollRight: false
    });

    const defaultFilterInputs = useFilterSectionOptions(
        fornecedores,
        clientes,
        categorias,
        produtos,
        orders,
        numeroCotacao,
        status
    );

    const visibleFilterInputs = useMemo(
        () => (filterInputs || defaultFilterInputs).filter(({ name }) => !hiddenFilterNames.includes(name)),
        [defaultFilterInputs, filterInputs, hiddenFilterNames]
    );

    const handleSelectChange = useCallback(
        (name) => ({ target }) => onChange(name, target.value),
        [onChange]
    );

    const updateScrollState = useCallback(() => {
        const element = scrollRef.current;
        if (!element) return;

        const maxScrollLeft = element.scrollWidth - element.clientWidth;

        setScrollState({
            canScrollLeft: element.scrollLeft > 4,
            canScrollRight: element.scrollLeft < maxScrollLeft - 4
        });
    }, []);

    const handleHorizontalScroll = useCallback((direction) => {
        const element = scrollRef.current;
        if (!element) return;

        const firstCard = element.querySelector(".filter-col");
        const cardWidth = firstCard?.getBoundingClientRect().width || 220;
        const gap = 14;

        element.scrollBy({
            left: direction * (cardWidth + gap),
            behavior: "smooth"
        });
    }, []);

    useEffect(() => {
        updateScrollState();

        const element = scrollRef.current;
        if (!element) return;

        element.addEventListener("scroll", updateScrollState, { passive: true });

        const resizeObserver = new ResizeObserver(() => {
            updateScrollState();
        });

        resizeObserver.observe(element);

        return () => {
            element.removeEventListener("scroll", updateScrollState);
            resizeObserver.disconnect();
        };
    }, [updateScrollState, visibleFilterInputs.length]);

    const dateFilter = useMemo(
        () => (
            <div className="filter-col" key="dateRange">
                <div className="filter-section-card">
                    <DateRangePicker
                        label="Periodo"
                        name="dateRange"
                        value={filters.dateRange}
                        onChange={({ target }) => onChange("dateRange", target.value)}
                    />
                </div>
            </div>
        ),
        [filters.dateRange, onChange]
    );

    const renderedInputs = useMemo(
        () =>
            visibleFilterInputs.map(({ label, name, data }) => (
                <div key={name} className="filter-col">
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
                </div>
            )),
        [visibleFilterInputs, filters, handleSelectChange]
    );

    const orderedInputs = useMemo(
        () => dateFilterPlacement === "start"
            ? [dateFilter, ...renderedInputs]
            : [...renderedInputs, dateFilter],
        [dateFilter, dateFilterPlacement, renderedInputs]
    );

    return (
        <div className="filter-section-carousel">
            {scrollState.canScrollLeft ? (
                <button
                    type="button"
                    className="filter-scroll-button filter-scroll-button--left"
                    onClick={() => handleHorizontalScroll(-1)}
                    aria-label="Rolar filtros para a esquerda"
                >
                    <FiChevronLeft />
                </button>
            ) : null}

            <div className="filter-section-row" ref={scrollRef}>
                {orderedInputs}

            </div>

            {scrollState.canScrollRight ? (
                <button
                    type="button"
                    className="filter-scroll-button filter-scroll-button--right"
                    onClick={() => handleHorizontalScroll(1)}
                    aria-label="Rolar filtros para a direita"
                >
                    <FiChevronRight />
                </button>
            ) : null}
        </div>
    );
};

export default React.memo(FilterSection);
