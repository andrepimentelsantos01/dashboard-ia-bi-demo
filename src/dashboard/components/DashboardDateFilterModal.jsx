import React from "react";
import { Button } from "react-bootstrap";
import ModalComponent from "/src/components/ModalV2";
import DateRangePicker from "./DateRangePicker";

const DashboardDateFilterModal = ({
    open,
    onClose,
    onClear,
    onApply,
    value,
    onChange,
    title = "Filtrar Período",
    label = "Período",
    modalClassName = ""
}) => (
    <div className={modalClassName}>
        <ModalComponent
            open={open}
            setOpen={onClose}
            title={title}
            content={(
                <div className="date-filter-modal">
                    <div className="date-filter-input">
                        <DateRangePicker
                            label={label}
                            name="dateRange"
                            value={value}
                            onChange={onChange}
                        />
                    </div>

                    <div className="date-filter-buttons">
                        <Button variant="light" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button variant="outline-danger" onClick={onClear}>
                            Limpar
                        </Button>
                        <Button variant="primary" onClick={onApply}>
                            Aplicar
                        </Button>
                    </div>
                </div>
            )}
        />
    </div>
);

export default React.memo(DashboardDateFilterModal);
