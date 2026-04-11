import { useMemo } from "react";

const normalize = arr =>
    (arr || []).map(item => {
        const name =
            item?.name ??
            item?.cliente ??
            item?.produto ??
            item?.categoria ??
            item?.fornecedor ??
            item?.label ??
            String(item ?? "");
        return {
            id: item?.id ?? String(name),
            name
        };
    });

const sortSmart = arr => {
    if (!arr?.length) return arr;
    const extractNumber = str => {
        const m = String(str).match(/\d+$/);
        return m ? Number(m[0]) : null;
    };
    return [...arr].sort((a, b) => {
        const na = extractNumber(a.name);
        const nb = extractNumber(b.name);
        if (na !== null && nb !== null && na !== nb) return na - nb;
        return a.name.localeCompare(b.name, "pt-BR", {
            sensitivity: "base",
            numeric: true
        });
    });
};

export const useFilterSectionOptions = (
    fornecedores,
    clientes,
    categorias,
    produtos,
    orders,
    numeroCotacao,
    status,
    customFilters
) => {
    const normalizedCustomFilters = useMemo(
        () => (customFilters || []).map((filter) => ({
            ...filter,
            data: sortSmart(normalize(filter?.data))
        })),
        [customFilters]
    );
    const normalizedFornecedores = useMemo(
        () => sortSmart(normalize(fornecedores)),
        [fornecedores]
    );

    const normalizedClientes = useMemo(
        () => sortSmart(normalize(clientes)),
        [clientes]
    );

    const normalizedCategorias = useMemo(
        () => sortSmart(normalize(categorias)),
        [categorias]
    );

    const normalizedProdutos = useMemo(
        () => sortSmart(normalize(produtos)),
        [produtos]
    );

    const normalizedOrders = useMemo(
        () => sortSmart(normalize(orders)),
        [orders]
    );

    const normalizedNumeroCotacao = useMemo(
        () => sortSmart(normalize(numeroCotacao)),
        [numeroCotacao]
    );
    const normalizedStatus = useMemo(
        () => sortSmart(normalize(status)),
        [status]
    );

    return useMemo(() => {
        const list = [
            { label: "Nº Pedido", name: "orders", data: normalizedOrders },
            { label: "Clientes", name: "clients", data: normalizedClientes },
            { label: "Produtos", name: "produtos", data: normalizedProdutos },
            { label: "Categorias", name: "categorias", data: normalizedCategorias },
            { label: "Fornecedores", name: "suppliers", data: normalizedFornecedores }
        ];

        if (numeroCotacao) {
            list.push({
                label: "Nº Cotação",
                name: "numeroCotacao",
                data: normalizedNumeroCotacao
            });
        }

        return list;
    }, [
        normalizedOrders,
        normalizedClientes,
        normalizedProdutos,
        normalizedCategorias,
        normalizedFornecedores,
        normalizedNumeroCotacao,
        numeroCotacao
    ]);
};
