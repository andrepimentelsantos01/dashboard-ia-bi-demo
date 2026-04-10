const naturalAsc = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base"
});

export const cleanString = (value) =>
    typeof value === "string"
        ? value
            .replace(/\u00A0/g, "")
            .replace(/\u200B/g, "")
            .replace(/\u200C/g, "")
            .replace(/\u200D/g, "")
            .replace(/\uFEFF/g, "")
            .trim()
        : value;

export const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (value === null || value === undefined || value === "") return 0;

    return (
        Number(
            String(value)
                .replace(/\./g, "")
                .replace(",", ".")
                .replace(/[^\d.-]/g, "")
        ) || 0
    );
};

export const mapUniqueBy = (items, key, mapper) =>
    Array.from(new Map(items.map(item => [item[key], mapper(item)])).values());

export const formatCurrency = (value) => {
    if (value === null || value === undefined) return "";

    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
};

export const buildOptionsFromRows = (rows, idKey, nameKey) =>
    mapUniqueBy(
        rows.filter(row => row[idKey]),
        idKey,
        row => ({
            id: row[idKey],
            name: row[nameKey]
        })
    );

export const buildOrderOptions = (rows, key = "purchase_order_id") =>
    mapUniqueBy(
        rows.filter(row => row[key]),
        key,
        row => ({
            id: row[key],
            name: row[key]
        })
    );

export const buildUniqueStringList = (rows, key) =>
    [...new Set(rows.map(row => row[key]).filter(Boolean))];

export const sortMetricEntries = (entries, valueKey = "valor", direction = "desc") =>
    [...entries].sort((a, b) => {
        const diff = direction === "asc"
            ? (a[valueKey] || 0) - (b[valueKey] || 0)
            : (b[valueKey] || 0) - (a[valueKey] || 0);

        if (diff !== 0) return diff;

        return naturalAsc.compare(String(a.name || ""), String(b.name || ""));
    });

export const mapToMetricArray = (record, valueKey = "valor", direction = "desc") =>
    sortMetricEntries(
        Object.entries(record).map(([name, value]) => ({
            name,
            [valueKey]: value
        })),
        valueKey,
        direction
    );

export const buildMonthKey = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return null;

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};
