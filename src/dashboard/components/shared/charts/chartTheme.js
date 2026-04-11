import { useEffect, useMemo, useState } from "react";

const getCurrentThemeState = () => {
    if (typeof document === "undefined") {
        return {
            mode: "light",
            schema: "default"
        };
    }

    const root = document.documentElement;

    return {
        mode: root.getAttribute("data-theme") === "dark" ? "dark" : "light",
        schema: root.getAttribute("data-dashboard-schema") || "default"
    };
};

export const useChartTheme = () => {
    const [theme, setTheme] = useState(getCurrentThemeState);

    useEffect(() => {
        if (typeof document === "undefined") return undefined;

        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            setTheme(getCurrentThemeState());
        });

        observer.observe(root, {
            attributes: true,
            attributeFilter: ["data-theme", "data-dashboard-schema"]
        });

        return () => observer.disconnect();
    }, []);

    return theme;
};

export const useChartThemeTokens = () => {
    const theme = useChartTheme();

    return useMemo(() => {
        const isDark = theme.mode === "dark";
        const isAdidas = theme.schema === "adidas";

        const defaultScatterPalette = [
            "#19b59f",
            "#159689",
            "#2f7f7a",
            "#5aaea6",
            "#78c8be",
            "#3a6f91"
        ];

        const adidasScatterPalette = isDark
            ? ["#f5f5f5", "#d6d6d6", "#b5b5b5", "#8e8e8e", "#666666", "#404040"]
            : ["#101010", "#2c2c2c", "#484848", "#6a6a6a", "#919191", "#b8b8b8"];

        const defaultHeatmapScale = ["#d9f4ef", "#8fd8cf", "#43bfae", "#17877e", "#0f4f4c"];
        const adidasHeatmapScale = isDark
            ? ["#f2f2f2", "#cfcfcf", "#9b9b9b", "#616161", "#242424"]
            : ["#f5f5f5", "#d9d9d9", "#adadad", "#6c6c6c", "#1d1d1d"];
        const defaultPiePalette = [
            "#4f86c6",
            "#2a9d8f",
            "#f4a261",
            "#7b6fd6",
            "#2bb3c0",
            "#e76f51",
            "#78d5dd",
            "#d97b2b",
            "#8db6f2",
            "#1f8a70"
        ];
        const adidasPiePalette = isDark
            ? ["#f2f2f2", "#cecece", "#ababab", "#858585", "#676767", "#dcdcdc", "#979797", "#737373", "#bfbfbf", "#4a4a4a"]
            : ["#111111", "#262626", "#3b3b3b", "#545454", "#6d6d6d", "#868686", "#9f9f9f", "#575757", "#c2c2c2", "#343434"];
        const defaultStatusPalette = {
            Entregue: "#2E8B57",
            "Em Trânsito": "#2F80ED",
            Faturado: "#8E44AD",
            "Em Recebimento": "#F2994A",
            Pendente: "#F2C94C",
            Atrasado: "#EB5757",
            Cancelado: "#6C757D",
            Desconhecido: "#7F8C8D",
            "In-store": "#2F80ED",
            Online: "#27AE60",
            Outlet: "#F2994A",
            "Sem status": "#9AA6B2"
        };
        const adidasStatusPalette = isDark
            ? {
                Entregue: "#d9d9d9",
                "Em Trânsito": "#bdbdbd",
                Faturado: "#969696",
                "Em Recebimento": "#c8c8c8",
                Pendente: "#858585",
                Atrasado: "#696969",
                Cancelado: "#4f4f4f",
                Desconhecido: "#7c7c7c",
                "In-store": "#f2f2f2",
                Online: "#b1b1b1",
                Outlet: "#888888",
                "Sem status": "#7c7c7c"
            }
            : {
                Entregue: "#111111",
                "Em Trânsito": "#2a2a2a",
                Faturado: "#434343",
                "Em Recebimento": "#5b5b5b",
                Pendente: "#787878",
                Atrasado: "#242424",
                Cancelado: "#969696",
                Desconhecido: "#6e6e6e",
                "In-store": "#0f0f0f",
                Online: "#4a4a4a",
                Outlet: "#727272",
                "Sem status": "#969696"
            };

        const chartPrimary = isAdidas
            ? (isDark ? "#f3f3f3" : "#171515")
            : "#17877e";
        const chartPrimarySoft = isAdidas
            ? (isDark ? "#bcbcbc" : "#707070")
            : "#5aaea6";
        const chartAreaFill = isAdidas
            ? (isDark ? "rgba(243, 243, 243, 0.18)" : "rgba(23, 21, 21, 0.14)")
            : "rgba(23, 135, 126, 0.24)";

        return {
            isDark,
            isAdidas,
            schema: theme.schema,
            textPrimary: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : (isDark ? "#dff5f1" : "#143f3d"),
            textSecondary: isAdidas
                ? (isDark ? "#cfcfcf" : "#4f4f4f")
                : (isDark ? "#9bc3be" : "#4b5864"),
            axisLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.32)")
                : (isDark ? "rgba(191, 238, 231, 0.28)" : "rgba(0,0,0,0.35)"),
            splitLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")
                : (isDark ? "rgba(191, 238, 231, 0.12)" : "rgba(0,0,0,0.08)"),
            sliderFill: isAdidas
                ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(23,21,21,0.12)")
                : (isDark ? "rgba(111, 213, 200, 0.2)" : "rgba(25, 181, 159, 0.18)"),
            chartPrimary,
            chartPrimarySoft,
            chartAreaFill,
            scatterPalette: isAdidas ? adidasScatterPalette : defaultScatterPalette,
            scatterOtherColor: isAdidas ? (isDark ? "#7d7d7d" : "#9a9a9a") : "#7b93a8",
            heatmapScale: isAdidas ? adidasHeatmapScale : defaultHeatmapScale,
            piePalette: isAdidas ? adidasPiePalette : defaultPiePalette,
            statusPalette: isAdidas ? adidasStatusPalette : defaultStatusPalette,
            mapText: isDark ? "#bfeee7" : "#4b5563",
            mapArea: isDark ? "#173634" : "#e8eef5",
            mapBorder: isDark ? "rgba(191, 238, 231, 0.18)" : "#c5ccd4",
            mapEmphasisLabel: isDark ? "#eafffb" : "#0e4946",
            mapEmphasisArea: isDark ? "#2b7f77" : "#9ddfd6",
            pieLegend: isDark ? "#b7d8d4" : "#4b5864",
            pieLabel: isDark ? "#e6fbf8" : "#2e3642",
            pieLabelLine: isDark ? "rgba(191, 238, 231, 0.34)" : "rgba(0,0,0,0.25)",
            chartLabelStrong: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : (isDark ? "#dff5f1" : "#171515")
        };
    }, [theme]);
};
