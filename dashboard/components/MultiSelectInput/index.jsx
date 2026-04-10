import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from 'react-i18next';
import './styles.scss';

const MultiSelectInput = ({
                              label,
                              data,
                              name,
                              newFunctionLabel,
                              newFunctionContent,
                              onChange,
                              translationPath,
                              value,
                              menuPortalTarget,
                              menuPosition
                          }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (value && Array.isArray(value)) {
            const validItems = data.filter(item => value.some(v => v.id === item.id));
            setSelectedItems(validItems);
        }

        if (!value || value.length === 0) {
            setSearch("");
        }
    }, [value, data]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = useCallback((item) => {
        setSelectedItems((prevSelectedItems) => {
            const alreadySelected = prevSelectedItems.some(selected => selected.id === item.id);
            const updatedSelection = alreadySelected
                ? prevSelectedItems.filter(selected => selected.id !== item.id)
                : [...prevSelectedItems, item];

            setTimeout(() => {
                onChange({
                    target: {
                        name: name,
                        value: updatedSelection,
                    },
                });
            }, 0);

            return updatedSelection;
        });
    }, [onChange, name]);

    const handleSelectAll = () => {
        setSelectedItems((prevSelectedItems) => {
            const allSelected = prevSelectedItems.length === data.length;
            const updatedSelection = allSelected ? [] : [...data];

            setTimeout(() => {
                onChange({
                    target: {
                        name: name,
                        value: updatedSelection,
                    },
                });
            }, 0);

            return updatedSelection;
        });
    };

    const isSelected = (item) => selectedItems.some(selected => selected.id === item.id);

    const visibleItems = selectedItems.slice(0, 3);
    const hiddenItems = selectedItems.slice(3);

    const filteredData = data.filter(item => {
        const labelText = translationPath ? t(`${translationPath}.${item.name}`) : item.name;
        return String(labelText).toLowerCase().includes(search.toLowerCase());
    });

    const renderSelectedItems = () => (
        <div className="selectedItems">
            <div>
                {visibleItems.length > 0 ? (
                    !isOpen ? (
                        <>
                            {visibleItems.map(item => (
                                <span key={item.id} className="selectedItemBadge">
                                    {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                                </span>
                            ))}
                            {hiddenItems.length > 0 && <span className="showMore">+{hiddenItems.length} outros</span>}
                        </>
                    ) : (
                        selectedItems.map(item => (
                            <span key={item.id} className="selectedItemBadge">
                                {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                            </span>
                        ))
                    )
                ) : (
                    <p>{t('select')}</p>
                )}
            </div>
            <i className={`feather icon-chevron-${isOpen ? "up" : "down"} dropdownIcon`} />
        </div>
    );

    const renderDropdownItems = () => (
        <>
            <div style={{ padding: "8px" }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    style={{ width: "100%", padding: "6px" }}
                />
            </div>

            <div
                className="dropdownItem"
                onClick={handleSelectAll}
            >
                {selectedItems.length === data.length ? 'Desmarcar todos' : "Selecionar todos"}
            </div>

            {filteredData.map(item => (
                <div
                    key={item.id}
                    className={`dropdownItem ${isSelected(item) ? 'selected' : ''}`}
                    onClick={() => handleSelect(item)}
                >
                    {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                    {isSelected(item) && <i className="feather icon-check" />}
                </div>
            ))}
        </>
    );

    return (
        <div className="MultiSelectInputContainer" ref={dropdownRef}>
            <p>{label}</p>
            <div className="customDropdown" onClick={(e) => {
                if (e.target.closest('.dropdownMenu')) return;
                setIsOpen(prev => !prev);
            }} style={{ position: "relative" }}>
                {renderSelectedItems()}
                {isOpen && (
                    <div className="dropdownMenu">
                        {renderDropdownItems()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiSelectInput;