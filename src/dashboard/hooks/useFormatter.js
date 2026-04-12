import { useMemo, useCallback } from "react";

export const useFormatter = () => {
    const parseNumber = useCallback(value => {
        if (value == null) return value;

        let cleaned = String(value).replace(/[^\d.,-]/g, "").trim();

        if (!cleaned) return value;

        if (cleaned.includes(",") && cleaned.includes(".")) {
            cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else if (cleaned.includes(",")) {
            const decimalDigits = cleaned.length - cleaned.lastIndexOf(",") - 1;
            cleaned = decimalDigits === 3
                ? cleaned.replace(/,/g, "")
                : cleaned.replace(",", ".");
        } else if (cleaned.includes(".")) {
            const decimalDigits = cleaned.length - cleaned.lastIndexOf(".") - 1;
            if (decimalDigits === 3) {
                cleaned = cleaned.replace(/\./g, "");
            }
        }

        const num = Number(cleaned);

        return isNaN(num) ? value : num;
    }, []);

    const formatCurrency = useCallback(
        (value, currencyCode = "BRL", locale = "pt-BR") => {
            const num = parseNumber(value);
            if (typeof num !== "number") return value;
            return num.toLocaleString(locale, {
                style: "currency",
                currency: currencyCode
            });
        },
        [parseNumber]
    );

    const formatIntegerBR = useCallback(
        value => {
            const num = parseNumber(value);
            if (typeof num !== "number") return value;
            return num.toLocaleString("pt-BR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        },
        [parseNumber]
    );

    const detectColumnType = useCallback(n => {
        const x = n.toLowerCase();
        return {
            currency:
                x.includes("valor") ||
                x.includes("preço") ||
                x.includes("preco") ||
                x.includes("ticket") ||
                x.includes("total"),
            integer:
                x.includes("quantidade") ||
                x.includes("volume") ||
                x.includes("consumo"),
            total:
                x === "total" || x.endsWith(" total")
        };
    }, []);

    const columnCache = useMemo(() => new Map(), []);

    const autoFormat = useCallback(
        (col, value, row = {}) => {
            if (!columnCache.has(col)) {
                columnCache.set(col, detectColumnType(col));
            }

            const type = columnCache.get(col);
            const currencyCode = row.currency_code || "BRL";
            const locale = currencyCode === "USD" ? "en-US" : "pt-BR";

            if (type.currency) return formatCurrency(value, currencyCode, locale);
            if (type.integer) return formatIntegerBR(value);

            if (type.total) {
                const num = parseNumber(value);
                if (typeof num !== "number") return value;
                const hasDecimal = String(value).includes(".") || String(value).includes(",");
                return hasDecimal ? formatCurrency(num, currencyCode, locale) : formatIntegerBR(num);
            }

            return value;
        },
        [columnCache, detectColumnType, formatCurrency, formatIntegerBR, parseNumber]
    );

    return {
        autoFormat,
        formatCurrencyBR: formatCurrency,
        formatIntegerBR
    };
};
