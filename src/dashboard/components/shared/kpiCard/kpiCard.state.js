import { useEffect, useMemo, useState } from "react";
import { useFormatter } from "../../../hooks/useFormatter";

const alphaRegex = /[a-zA-Z]/;
const easing = (t) => 1 - (1 - t) ** 3;

const parseToNumber = (v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
        if (v.trim().endsWith("%")) return null;
        if (alphaRegex.test(v)) return null;
        const cleaned = v.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
    }
    return null;
};

export const useKpiCardState = (label, rawValue) => {
    const { autoFormat } = useFormatter();

    const numericValue = useMemo(() => parseToNumber(rawValue), [rawValue]);
    const isNumeric = numericValue !== null;

    const [state, setState] = useState(() => ({
        displayValue: isNumeric ? 0 : rawValue
    }));

    const isEmpty = rawValue === undefined || rawValue === null || rawValue === "";

    useEffect(() => {
        let frame;
        if (!isNumeric) {
            setState({ displayValue: rawValue });
            return;
        }
        const end = numericValue;
        const duration = 350;
        const start = performance.now();
        const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            setState({ displayValue: end * easing(progress) });
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [isNumeric, numericValue, rawValue]);

    const formatted = useMemo(() => {
        if (!isNumeric) return rawValue;
        return autoFormat(label, state.displayValue);
    }, [isNumeric, rawValue, autoFormat, label, state.displayValue]);

    return {
        isEmpty,
        formatted
    };
};
