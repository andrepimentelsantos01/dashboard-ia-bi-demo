import React, { useCallback, useEffect, useState } from "react";
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
    containerStyle = "Default",
    btnStyle = "Default"
}) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const containerRef = React.useRef(null);

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
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                    onClick={() => setIsOpen((prev) => !prev)}
                >
                    {formatPeriod(startDate, endDate)}
                </button>

                {isOpen && (
                    <div className="dropdown-content">
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateRangePicker;
