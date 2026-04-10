import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./styles.scss";

const MultiSelectInput = ({
    label,
    data,
    name,
    newFunctionLabel,
    newFunctionContent,
    onChange,
    translationPath,
    value
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [search, setSearch] = useState("");
    const [menuStyle, setMenuStyle] = useState(null);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const selectedItemsRef = useRef([]);

    const syncSelectedItems = useCallback((nextValue = [], nextData = []) => {
        if (!Array.isArray(nextValue) || nextValue.length === 0) {
            selectedItemsRef.current = [];
            setSelectedItems([]);
            return;
        }

        const mappedItems = nextValue.map((item) => {
            const matchedItem = nextData.find((option) => option.id === item.id);
            return matchedItem || item;
        });

        selectedItemsRef.current = mappedItems;
        setSelectedItems(mappedItems);
    }, []);

    const commitSelection = useCallback(() => {
        onChange({
            target: {
                name,
                value: selectedItemsRef.current
            }
        });
    }, [name, onChange]);

    useEffect(() => {
        syncSelectedItems(value, data);

        if (!value || value.length === 0) {
            setSearch("");
        }
    }, [value, data, syncSelectedItems]);

    const updateMenuPosition = useCallback(() => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const width = Math.max(rect.width, 240);
        const viewportWidth = window.innerWidth;
        const left = Math.min(
            Math.max(12, rect.left),
            Math.max(12, viewportWidth - width - 12)
        );

        setMenuStyle({
            top: rect.bottom + 8,
            left,
            width
        });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedTrigger = dropdownRef.current?.contains(event.target);
            const clickedMenu = menuRef.current?.contains(event.target);

            if (!clickedTrigger && !clickedMenu) {
                if (isOpen) {
                    commitSelection();
                }
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [commitSelection, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        updateMenuPosition();

        const handleWindowChange = () => {
            updateMenuPosition();
        };

        window.addEventListener("resize", handleWindowChange);
        window.addEventListener("scroll", handleWindowChange, true);

        return () => {
            window.removeEventListener("resize", handleWindowChange);
            window.removeEventListener("scroll", handleWindowChange, true);
        };
    }, [isOpen, updateMenuPosition]);

    const handleSelect = useCallback((item) => {
        setSelectedItems((prevSelectedItems) => {
            const alreadySelected = prevSelectedItems.some((selected) => selected.id === item.id);
            const updatedSelection = alreadySelected
                ? prevSelectedItems.filter((selected) => selected.id !== item.id)
                : [...prevSelectedItems, item];

            selectedItemsRef.current = updatedSelection;
            return updatedSelection;
        });
    }, []);

    const mergedData = React.useMemo(() => {
        const byId = new Map();

        [...data, ...selectedItems].forEach((item) => {
            if (!item?.id) return;
            byId.set(item.id, item);
        });

        return Array.from(byId.values());
    }, [data, selectedItems]);

    const handleSelectAll = useCallback(() => {
        setSelectedItems((prevSelectedItems) => {
            const allSelected = prevSelectedItems.length === mergedData.length;
            const updatedSelection = allSelected ? [] : [...mergedData];

            selectedItemsRef.current = updatedSelection;
            return updatedSelection;
        });
    }, [mergedData]);

    const isSelected = (item) => selectedItems.some((selected) => selected.id === item.id);

    const visibleItems = selectedItems.slice(0, 3);
    const hiddenItems = selectedItems.slice(3);

    const filteredData = mergedData.filter((item) => {
        const labelText = translationPath ? t(`${translationPath}.${item.name}`) : item.name;
        return String(labelText).toLowerCase().includes(search.toLowerCase());
    });

    const renderSelectedItems = () => (
        <div className="selectedItems">
            <div>
                {visibleItems.length > 0 ? (
                    !isOpen ? (
                        <>
                            {visibleItems.map((item) => (
                                <span key={item.id} className="selectedItemBadge">
                                    {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                                </span>
                            ))}
                            {hiddenItems.length > 0 ? (
                                <span className="showMore">+{hiddenItems.length} outros</span>
                            ) : null}
                        </>
                    ) : (
                        selectedItems.map((item) => (
                            <span key={item.id} className="selectedItemBadge">
                                {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                            </span>
                        ))
                    )
                ) : (
                    <p>{t("select")}</p>
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

            <div className="dropdownItem" onClick={handleSelectAll}>
                {selectedItems.length === data.length ? "Desmarcar todos" : "Selecionar todos"}
            </div>

            {filteredData.map((item) => (
                <div
                    key={item.id}
                    className={`dropdownItem ${isSelected(item) ? "selected" : ""}`}
                    onClick={() => handleSelect(item)}
                >
                    {translationPath ? t(`${translationPath}.${item.name}`) : item.name}
                    {isSelected(item) ? <i className="feather icon-check" /> : null}
                </div>
            ))}
        </>
    );

    return (
        <div className="MultiSelectInputContainer" ref={dropdownRef}>
            <p>{label}</p>
            <div
                className="customDropdown"
                onClick={(e) => {
                    if (e.target.closest(".multi-select-dropdown-menu")) return;

                    setIsOpen((prev) => {
                        if (prev) {
                            commitSelection();
                        }

                        return !prev;
                    });
                }}
                style={{ position: "relative" }}
                ref={triggerRef}
            >
                {renderSelectedItems()}
            </div>

            {isOpen && typeof document !== "undefined"
                ? createPortal(
                    <div
                        className="multi-select-dropdown-menu"
                        style={menuStyle || undefined}
                        ref={menuRef}
                    >
                        {renderDropdownItems()}
                    </div>,
                    document.body
                )
                : null}
        </div>
    );
};

export default MultiSelectInput;
