import React, { useCallback, useMemo } from "react";
import "./ClassificationCurvesButtons.css";

const ABC_OPTIONS = [
    { value: "A", label: "A", flex: 3 },
    { value: "B", label: "B", flex: 1 },
    { value: "C", label: "C", flex: 0.6 }
];

const XYZ_OPTIONS = [
    { value: "X", label: "X", flex: 3 },
    { value: "Y", label: "Y", flex: 2 },
    { value: "Z", label: "Z", flex: 1.2 }
];

const ClassificationCurvesButtons = ({ filters, setFilters }) => {
    const activeAbc = filters?.classificacaoABC || null;
    const activeXyz = filters?.classificacaoXYZ || null;

    const handleToggle = useCallback(
        (field, value) => {
            setFilters((previous) => {
                const isSameValue = previous?.[field] === value;

                return {
                    ...previous,
                    [field]: isSameValue ? null : value
                };
            });
        },
        [setFilters]
    );

    const abcOptions = useMemo(
        () =>
            ABC_OPTIONS.map((item) => ({
                ...item,
                hidden: Boolean(activeAbc) && activeAbc !== item.value,
                active: activeAbc === item.value,
                solo: Boolean(activeAbc) && activeAbc === item.value
            })),
        [activeAbc]
    );

    const xyzOptions = useMemo(
        () =>
            XYZ_OPTIONS.map((item) => ({
                ...item,
                hidden: Boolean(activeXyz) && activeXyz !== item.value,
                active: activeXyz === item.value,
                solo: Boolean(activeXyz) && activeXyz === item.value
            })),
        [activeXyz]
    );

    const abcButtons = useMemo(
        () =>
            abcOptions.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    className={`classification-curve-button ${item.active ? "is-active" : ""} ${item.hidden ? "is-collapsed" : ""} ${item.solo ? "is-solo" : ""}`}
                    style={{ flex: item.flex }}
                    onClick={() => handleToggle("classificacaoABC", item.value)}
                    aria-pressed={item.active}
                    aria-hidden={item.hidden}
                    tabIndex={item.hidden ? -1 : 0}
                >
                    {item.label}
                </button>
            )),
        [abcOptions, handleToggle]
    );

    const xyzButtons = useMemo(
        () =>
            xyzOptions.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    className={`classification-curve-button ${item.active ? "is-active" : ""} ${item.hidden ? "is-collapsed" : ""} ${item.solo ? "is-solo" : ""}`}
                    style={{ flex: item.flex }}
                    onClick={() => handleToggle("classificacaoXYZ", item.value)}
                    aria-pressed={item.active}
                    aria-hidden={item.hidden}
                    tabIndex={item.hidden ? -1 : 0}
                >
                    {item.label}
                </button>
            )),
        [handleToggle, xyzOptions]
    );

    return (
        <div className="classification-curves-panel">
            <div className="classification-curve-block">
                <div className="classification-curve-row">{abcButtons}</div>
            </div>

            <div className="classification-curve-block">
                <div className="classification-curve-row">{xyzButtons}</div>
            </div>
        </div>
    );
};

export default React.memo(ClassificationCurvesButtons);
