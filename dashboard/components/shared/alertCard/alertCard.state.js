import { useState, useMemo, useCallback } from "react";

export const adjustColorBrightness = (color, percent) => {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = (num >> 16) + amt;
    const g = ((num >> 8) & 255) + amt;
    const b = (num & 255) + amt;
    const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
    return (
        "#" +
        ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b))
            .toString(16)
            .slice(1)
    );
};

const configs = Object.freeze({
    "Clientes com atraso": { color: "#deb605", filter: "clienteAtraso" },
    "Fornecedores com atraso": { color: "#b91c1c", filter: "fornecedorAtraso" },
    "Pedidos com atraso": { color: "#1d4ed8", filter: "pedidoAtraso" },
    "Cotações em aberto": { color: "#facc15", filter: "status", value: "Em Cotação" }
});

const defaultConfig = Object.freeze({ color: "#4f46e5", filter: null });

export const getCardConfig = (label) => configs[label] || defaultConfig;

export const useAlertCardState = (label, onCrossFilter) => {
    const config = useMemo(() => getCardConfig(label), [label]);
    const activeColor = useMemo(() => adjustColorBrightness(config.color, 20), [config.color]);

    const [isActive, setIsActive] = useState(false);

    const handleClick = useCallback(() => {
        if (!onCrossFilter) return;
        setIsActive((prev) => {
            if (prev) {
                onCrossFilter({ type: "reset" });
                return false;
            }
            if (config.filter) {
                if (config.value !== undefined) {
                    onCrossFilter({ type: config.filter, value: config.value });
                } else {
                    onCrossFilter({ type: config.filter });
                }
            }
            return true;
        });
    }, [onCrossFilter, config.filter, config.value]);

    return { isActive, config, activeColor, handleClick };
};
