const ABC_ORDER = ["A", "B", "C"];
const XYZ_ORDER = ["X", "Y", "Z"];
const MATRIX_ORDER = ["AX", "AY", "AZ", "BX", "BY", "BZ", "CX", "CY", "CZ"];

const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeClassToken = (value, allowed) => {
    const token = String(value || "").trim().toUpperCase();
    return allowed.includes(token) ? token : null;
};

const getMostFrequentToken = (tokens, allowed) => {
    const counter = new Map();

    tokens.forEach((token) => {
        const normalized = normalizeClassToken(token, allowed);
        if (!normalized) return;
        counter.set(normalized, (counter.get(normalized) || 0) + 1);
    });

    return [...counter.entries()]
        .sort((a, b) => b[1] - a[1] || allowed.indexOf(a[0]) - allowed.indexOf(b[0]))[0]?.[0] || null;
};

const createBucket = (name) => ({
    name,
    value: 0,
    entityCount: 0,
    totalQuantity: 0,
    entities: []
});

const finalizeBuckets = (buckets, order, totalValue) =>
    order.map((name) => {
        const bucket = buckets[name] || createBucket(name);
        return {
            ...bucket,
            percentage: totalValue > 0 ? (bucket.value / totalValue) * 100 : 0,
            filterPayload:
                name.length === 1
                    ? {
                        type: name === "A" || name === "B" || name === "C" ? "abc" : "xyz",
                        value: name
                    }
                    : {
                        type: "merge",
                        filters: {
                            classificacaoABC: name[0],
                            classificacaoXYZ: name[1]
                        }
                    }
        };
    });

export const buildClassificationTreemapData = (rows = [], config = {}) => {
    const {
        entityKey,
        valueKey = "valorTotal",
        quantityKey = "quantidade",
        monthKey = "data",
        abcKey = "classificacaoABC",
        xyzKey = "classificacaoXYZ"
    } = config;

    const entityMap = new Map();

    rows.forEach((row) => {
        const entityName = row[entityKey];
        if (!entityName) return;

        const current = entityMap.get(entityName) || {
            name: entityName,
            totalValue: 0,
            totalQuantity: 0,
            abcTokens: [],
            xyzTokens: [],
            monthlyTotals: {}
        };

        current.totalValue += toNumber(row[valueKey]);
        current.totalQuantity += toNumber(row[quantityKey]);
        current.abcTokens.push(row[abcKey]);
        current.xyzTokens.push(row[xyzKey]);

        entityMap.set(entityName, current);
    });

    const entities = [...entityMap.values()];

    entities.forEach((entity) => {
        entity.abcClass = getMostFrequentToken(entity.abcTokens, ABC_ORDER) || "C";
        entity.xyzClass = getMostFrequentToken(entity.xyzTokens, XYZ_ORDER) || "Z";
        entity.matrixClass = `${entity.abcClass}${entity.xyzClass}`;
    });

    const totalValue = entities.reduce((sum, entity) => sum + entity.totalValue, 0);
    const abcBuckets = Object.fromEntries(ABC_ORDER.map((name) => [name, createBucket(name)]));
    const xyzBuckets = Object.fromEntries(XYZ_ORDER.map((name) => [name, createBucket(name)]));
    const matrixBuckets = Object.fromEntries(MATRIX_ORDER.map((name) => [name, createBucket(name)]));

    entities.forEach((entity) => {
        const assign = (bucket) => {
            bucket.value += entity.totalValue;
            bucket.entityCount += 1;
            bucket.totalQuantity += entity.totalQuantity;
            bucket.entities.push(entity.name);
        };

        assign(abcBuckets[entity.abcClass]);
        assign(xyzBuckets[entity.xyzClass]);
        assign(matrixBuckets[entity.matrixClass]);
    });

    return {
        entityClassifications: entities,
        abcTreemap: finalizeBuckets(abcBuckets, ABC_ORDER, totalValue),
        xyzTreemap: finalizeBuckets(xyzBuckets, XYZ_ORDER, totalValue),
        abcXyzMatrixTreemap: finalizeBuckets(matrixBuckets, MATRIX_ORDER, totalValue)
    };
};