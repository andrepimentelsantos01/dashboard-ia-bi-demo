import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.scss";
import { useTranslation } from "react-i18next";
import { ptBR } from "date-fns/locale";

const DateRangePicker = ({
    label,
    name,
    onChange,
    value,
    containerStyle = "Default"
}) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    const formatPeriod = (start, end) => {
        const options = { day: "2-digit", month: "short", year: "numeric" };

        if (!start && !end) {
            return "Selecione o Período";
        }

        if (!end) {
            return t("from_date", {
                date: start.toLocaleDateString("pt-BR", options)
            });
        }

        if (!start) {
            return t("to_date", {
                date: end.toLocaleDateString("pt-BR", options)
            });
        }

        return `${start.toLocaleDateString("pt-BR", options)} - ${end.toLocaleDateString("pt-BR", options)}`;
    };

    useEffect(() => {
        if (value) {
            setStartDate(value.start);
            setEndDate(value.end);
            return;
        }

        setStartDate(null);
        setEndDate(null);
    }, [value]);

    const updateDropdownPosition = useCallback(() => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const width = Math.max(rect.width, 260);
        const viewportWidth = window.innerWidth;
        const left = Math.min(
            Math.max(12, rect.left),
            Math.max(12, viewportWidth - width - 12)
        );

        setDropdownStyle({
            top: rect.bottom + 8,
            left,
            width
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedTrigger = containerRef.current?.contains(event.target);
            const clickedDropdown = dropdownRef.current?.contains(event.target);

            if (!clickedTrigger && !clickedDropdown) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        updateDropdownPosition();

        const handleWindowChange = () => {
            updateDropdownPosition();
        };

        window.addEventListener("resize", handleWindowChange);
        window.addEventListener("scroll", handleWindowChange, true);

        return () => {
            window.removeEventListener("resize", handleWindowChange);
            window.removeEventListener("scroll", handleWindowChange, true);
        };
    }, [isOpen, updateDropdownPosition]);

    const handleDateRangePicker = useCallback((date, type) => {
        const nextStartDate = type === "start" ? date : startDate;
        const nextEndDate = type === "end" ? date : endDate;

        setStartDate(nextStartDate);
        setEndDate(nextEndDate);

        if (nextStartDate && nextEndDate) {
            onChange({
                target: {
                    name,
                    value: {
                        start: nextStartDate,
                        end: nextEndDate
                    }
                }
            });

            setIsOpen(false);
        }
    }, [endDate, name, onChange, startDate]);

    return (
        <div className="filter-container-date-range" ref={containerRef}>
            <p className="label">{label}</p>

            <div className="dropdown">
                <button
                    type="button"
                    className={`dropdown-button dropdown-button--${containerStyle}`}
                    onClick={() => setIsOpen((previous) => !previous)}
                    ref={buttonRef}
                >
                    {formatPeriod(startDate, endDate)}
                </button>
            </div>

            {isOpen && typeof document !== "undefined"
                ? createPortal(
                    <div
                        className="dropdown-content"
                        style={dropdownStyle || undefined}
                        ref={dropdownRef}
                    >
                        <div className="date-picker-group">
                            <label className="date-label">{t("start_date")}:</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => handleDateRangePicker(date, "start")}
                                dateFormat="dd/MM/yyyy"
                                className="date-picker"
                                maxDate={endDate}
                                locale={ptBR}
                            />
                        </div>

                        <div className="date-picker-group">
                            <label className="date-label">{t("end_date")}:</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => handleDateRangePicker(date, "end")}
                                dateFormat="dd/MM/yyyy"
                                className="date-picker"
                                minDate={startDate}
                                locale={ptBR}
                            />
                        </div>
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
};

export default DateRangePicker;
