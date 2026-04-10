export function getKpiVariation(historyArray) {
    if (!Array.isArray(historyArray) || historyArray.length < 2) return null;

    const prev = historyArray[historyArray.length - 2];
    const curr = historyArray[historyArray.length - 1];

    if (prev === 0 && curr > 0) return 100;
    if (prev === 0 && curr === 0) return 0;
    if (prev > 0 && curr === 0) return -100;

    if (prev === 0) return null;

    return ((curr - prev) / prev) * 100;
}
