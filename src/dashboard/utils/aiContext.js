const LIMIT = 8;

export const topItems = (items = [], valueKey = "valor", limit = LIMIT) =>
    items
        .slice(0, limit)
        .map((item) => ({
            nome: item.name,
            valor: Number(item[valueKey] ?? item.value ?? item.valor ?? 0)
        }));

export const compactSeries = (labels = [], values = [], limit = 12) =>
    labels.slice(-limit).map((label, index) => ({
        periodo: label,
        valor: Number(values.slice(-limit)[index] || 0)
    }));

export const compactFilters = (filters = {}) =>
    Object.fromEntries(
        Object.entries(filters).filter(([, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== null && value !== "";
        })
    );

export const publishDashboardAiContext = (context) => {
    if (typeof document === "undefined") return undefined;

    const payload = {
        ...context,
        atualizadoEm: new Date().toISOString()
    };
    const serialized = JSON.stringify(payload);

    document.documentElement.setAttribute("data-dashboard-ai-context", serialized);

    return () => {
        const current = document.documentElement.getAttribute("data-dashboard-ai-context");

        try {
            if (current && JSON.parse(current)?.aba === context.aba) {
                document.documentElement.removeAttribute("data-dashboard-ai-context");
            }
        } catch {
            document.documentElement.removeAttribute("data-dashboard-ai-context");
        }
    };
};
