export const formatCurrencyValue = (
    value,
    {
        currencyCode = "BRL",
        locale = "pt-BR",
        minimumFractionDigits = 2,
        maximumFractionDigits = 2
    } = {}
) =>
    Number(value || 0).toLocaleString(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits,
        maximumFractionDigits
    });

export const formatCompactCurrencyValue = (
    value,
    {
        currencyCode = "BRL",
        locale = "pt-BR"
    } = {}
) =>
    new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        notation: "compact",
        maximumFractionDigits: 1
    }).format(Number(value || 0));
