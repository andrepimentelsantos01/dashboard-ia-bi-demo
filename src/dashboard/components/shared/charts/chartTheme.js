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
        const isAmazon = theme.schema === "amazon";
        const isRestaurant = theme.schema === "restaurant";
        const isLogistics = theme.schema === "logistics";

        const defaultScatterPalette = ["#19b59f", "#159689", "#2f7f7a", "#5aaea6", "#78c8be", "#3a6f91"];
        const adidasScatterPalette = isDark
            ? ["#f5f5f5", "#d6d6d6", "#b5b5b5", "#8e8e8e", "#666666", "#404040"]
            : ["#101010", "#2c2c2c", "#484848", "#6a6a6a", "#919191", "#b8b8b8"];
        const amazonScatterPalette = isDark
            ? ["#89bfff", "#dbe7f5", "#ffb84d", "#ffd18a", "#9ed8c2", "#c8d6f2"]
            : ["#1f2937", "#5b6472", "#5b9fff", "#ff9900", "#ffb84d", "#9fb7d9"];
        const restaurantScatterPalette = isDark
            ? ["#c8a96b", "#b8924f", "#f6f1ea", "#5a2e2e", "#d8cbb8", "#8f7150"]
            : ["#5a2e2e", "#c8a96b", "#b8924f", "#2a211b", "#d8cbb8", "#8f7150"];
        const logisticsScatterPalette = isDark
            ? ["#ff3557", "#ffffff", "#d9dde3", "#d90429", "#8f1024", "#6f737a"]
            : ["#d90429", "#111111", "#b10322", "#6b7280", "#d9dde3", "#7f1d2d"];

        const defaultHeatmapScale = ["#d9f4ef", "#8fd8cf", "#43bfae", "#17877e", "#0f4f4c"];
        const adidasHeatmapScale = isDark
            ? ["#f2f2f2", "#cfcfcf", "#9b9b9b", "#616161", "#242424"]
            : ["#f5f5f5", "#d9d9d9", "#adadad", "#6c6c6c", "#1d1d1d"];
        const amazonHeatmapScale = isDark
            ? ["#0b1220", "#172033", "#395477", "#89bfff", "#ffb84d"]
            : ["#f7f9fc", "#d7e1ef", "#a6b7ce", "#5b6472", "#1f2937"];
        const restaurantHeatmapScale = isDark
            ? ["#1a1410", "#241b16", "#5a2e2e", "#b8924f", "#c8a96b"]
            : ["#f6f1ea", "#d8cbb8", "#c8a96b", "#5a2e2e", "#2a211b"];
        const logisticsHeatmapScale = isDark
            ? ["#0b0b0c", "#16181d", "#64101d", "#b10322", "#d90429"]
            : ["#ffffff", "#fdebed", "#f0a7b3", "#d90429", "#111111"];

        const defaultPiePalette = ["#4f86c6", "#2a9d8f", "#f4a261", "#7b6fd6", "#2bb3c0", "#e76f51", "#78d5dd", "#d97b2b", "#8db6f2", "#1f8a70"];
        const adidasPiePalette = isDark
            ? ["#0f3d8a", "#7a1f1f", "#245f45", "#8a6a10", "#f2f2f2", "#444444", "#c7c7c7", "#2c2c2c", "#6d6d6d", "#9d9d9d"]
            : ["#0f3d8a", "#8f2d2d", "#1f6a4b", "#9b7a18", "#111111", "#4f4f4f", "#d9d9d9", "#2a2a2a", "#7d7d7d", "#b8b8b8"];
        const amazonPiePalette = isDark
            ? ["#89bfff", "#ffb84d", "#dbe7f5", "#9ed8c2", "#c7b6ff", "#ffd18a", "#6f8fb8", "#f3c0b9", "#a3cfae", "#f8e3bf"]
            : ["#1f2937", "#ff9900", "#5b9fff", "#7fd2be", "#a591f2", "#ffb84d", "#7b8ea6", "#f4c3b1", "#a8d8b8", "#d8e1ee"];
        const restaurantPiePalette = isDark
            ? ["#c8a96b", "#5a2e2e", "#f6f1ea", "#b8924f", "#d8cbb8", "#8f7150", "#f8f6f2", "#241b16", "#a58456", "#6d4b37"]
            : ["#5a2e2e", "#c8a96b", "#2a211b", "#b8924f", "#d8cbb8", "#8f7150", "#f6f1ea", "#6b3a33", "#a58456", "#241b16"];
        const logisticsPiePalette = isDark
            ? ["#d90429", "#ffffff", "#b10322", "#d9dde3", "#7f1d2d", "#6f737a", "#ff3557", "#16181d", "#f5b1bd", "#3a3d45"]
            : ["#d90429", "#111111", "#b10322", "#d9dde3", "#7f1d2d", "#6f737a", "#fdebed", "#0b0b0c", "#f0a7b3", "#3a3d45"];

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
            Cash: "#17877e",
            "Walk-in": "#4f86c6",
            "Sem status": "#9AA6B2"
        };
        const adidasStatusPalette = isDark
            ? {
                Entregue: "#245f45",
                "Em Trânsito": "#0f3d8a",
                Faturado: "#6a6a6a",
                "Em Recebimento": "#8a6a10",
                Pendente: "#b38d14",
                Atrasado: "#7a1f1f",
                Cancelado: "#2c2c2c",
                Desconhecido: "#7c7c7c",
                "In-store": "#0f3d8a",
                Online: "#245f45",
                Outlet: "#8a6a10",
                Cash: "#444444",
                "Walk-in": "#c7c7c7",
                "Sem status": "#7c7c7c"
            }
            : {
                Entregue: "#1f6a4b",
                "Em Trânsito": "#0f3d8a",
                Faturado: "#4f4f4f",
                "Em Recebimento": "#9b7a18",
                Pendente: "#8a6a10",
                Atrasado: "#8f2d2d",
                Cancelado: "#2a2a2a",
                Desconhecido: "#6e6e6e",
                "In-store": "#0f3d8a",
                Online: "#1f6a4b",
                Outlet: "#9b7a18",
                Cash: "#4f4f4f",
                "Walk-in": "#d9d9d9",
                "Sem status": "#969696"
            };
        const amazonStatusPalette = isDark
            ? {
                Entregue: "#9ed8c2",
                "Em Trânsito": "#89bfff",
                Faturado: "#c7b6ff",
                "Em Recebimento": "#ffd18a",
                Pendente: "#ffb84d",
                Atrasado: "#f3c0b9",
                Cancelado: "#7b8ea6",
                Desconhecido: "#a5b4c8",
                Online: "#89bfff",
                Cash: "#ffb84d",
                "Walk-in": "#9ed8c2",
                "Sem status": "#a5b4c8"
            }
            : {
                Entregue: "#7fd2be",
                "Em Trânsito": "#5b9fff",
                Faturado: "#8f7ae8",
                "Em Recebimento": "#ffd18a",
                Pendente: "#ff9900",
                Atrasado: "#f3c0b9",
                Cancelado: "#7b8ea6",
                Desconhecido: "#9aa7b8",
                Online: "#5b9fff",
                Cash: "#ff9900",
                "Walk-in": "#7fd2be",
                "Sem status": "#9aa7b8"
            };
        const restaurantStatusPalette = isDark
            ? {
                Entregue: "#c8a96b",
                Online: "#d8cbb8",
                Cash: "#b8924f",
                "Walk-in": "#f6f1ea",
                Pendente: "#8f7150",
                Atrasado: "#5a2e2e",
                Cancelado: "#2a211b",
                Desconhecido: "#d8cbb8",
                "Sem status": "#d8cbb8"
            }
            : {
                Entregue: "#5a2e2e",
                Online: "#c8a96b",
                Cash: "#b8924f",
                "Walk-in": "#8f7150",
                Pendente: "#a58456",
                Atrasado: "#7a3434",
                Cancelado: "#2a211b",
                Desconhecido: "#8f7150",
                "Sem status": "#8f7150"
            };
        const logisticsStatusPalette = isDark
            ? {
                Entregue: "#d90429",
                "Em Trânsito": "#ffffff",
                Faturado: "#d9dde3",
                "Em Recebimento": "#ff3557",
                Pendente: "#f5b1bd",
                Atrasado: "#b10322",
                Cancelado: "#6f737a",
                Desconhecido: "#d9dde3",
                "Sem status": "#d9dde3"
            }
            : {
                Entregue: "#d90429",
                "Em Trânsito": "#111111",
                Faturado: "#6f737a",
                "Em Recebimento": "#b10322",
                Pendente: "#7f1d2d",
                Atrasado: "#b10322",
                Cancelado: "#6f737a",
                Desconhecido: "#6f737a",
                "Sem status": "#6f737a"
            };

        const chartPrimary = isAdidas
            ? (isDark ? "#f3f3f3" : "#171515")
            : isAmazon
                ? (isDark ? "#89bfff" : "#1f2937")
                : isRestaurant
                    ? "#c8a96b"
                    : isLogistics
                        ? "#d90429"
                        : "#17877e";
        const chartPrimarySoft = isAdidas
            ? (isDark ? "#bcbcbc" : "#707070")
            : isAmazon
                ? (isDark ? "#ffb84d" : "#5b6472")
                : isRestaurant
                    ? (isDark ? "#f6f1ea" : "#5a2e2e")
                    : isLogistics
                        ? (isDark ? "#ffffff" : "#111111")
                        : "#5aaea6";
        const chartAreaFill = isAdidas
            ? (isDark ? "rgba(243, 243, 243, 0.18)" : "rgba(23, 21, 21, 0.14)")
            : isAmazon
                ? (isDark ? "rgba(137, 191, 255, 0.18)" : "rgba(31, 41, 55, 0.14)")
                : isRestaurant
                    ? (isDark ? "rgba(200, 169, 107, 0.18)" : "rgba(200, 169, 107, 0.16)")
                    : isLogistics
                        ? "rgba(217, 4, 41, 0.16)"
                        : "rgba(23, 135, 126, 0.24)";
        const chartGradientStart = isAmazon ? chartPrimary : chartPrimary;
        const chartGradientEnd = isAmazon
            ? (isDark ? "#ffb84d" : "#ff9900")
            : chartPrimarySoft;

        return {
            isDark,
            isAdidas,
            isAmazon,
            isRestaurant,
            isLogistics,
            schema: theme.schema,
            textPrimary: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : isAmazon
                    ? (isDark ? "#f4f6fb" : "#161616")
                    : isRestaurant
                        ? (isDark ? "#f8f6f2" : "#2a211b")
                        : isLogistics
                            ? (isDark ? "#ffffff" : "#111111")
                            : (isDark ? "#dff5f1" : "#143f3d"),
            textSecondary: isAdidas
                ? (isDark ? "#cfcfcf" : "#4f4f4f")
                : isAmazon
                    ? (isDark ? "#c4cfde" : "#4e5664")
                    : isRestaurant
                        ? (isDark ? "#d8cbb8" : "#5a2e2e")
                        : isLogistics
                            ? (isDark ? "#d9dde3" : "#4b5563")
                            : (isDark ? "#9bc3be" : "#4b5864"),
            axisLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.32)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.24)" : "rgba(17,17,17,0.24)")
                    : isRestaurant
                        ? (isDark ? "rgba(200,169,107,0.26)" : "rgba(90,46,46,0.26)")
                        : isLogistics
                            ? (isDark ? "rgba(217,4,41,0.34)" : "rgba(17,17,17,0.28)")
                            : (isDark ? "rgba(191, 238, 231, 0.28)" : "rgba(0,0,0,0.35)"),
            splitLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.1)" : "rgba(17,17,17,0.08)")
                    : isRestaurant
                        ? (isDark ? "rgba(200,169,107,0.12)" : "rgba(90,46,46,0.09)")
                        : isLogistics
                            ? (isDark ? "rgba(217,4,41,0.13)" : "rgba(17,17,17,0.08)")
                            : (isDark ? "rgba(191, 238, 231, 0.12)" : "rgba(0,0,0,0.08)"),
            sliderFill: isAdidas
                ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(23,21,21,0.12)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.18)" : "rgba(255,153,0,0.14)")
                    : isRestaurant
                        ? (isDark ? "rgba(200,169,107,0.18)" : "rgba(200,169,107,0.16)")
                        : isLogistics
                            ? "rgba(217,4,41,0.18)"
                            : (isDark ? "rgba(111, 213, 200, 0.2)" : "rgba(25, 181, 159, 0.18)"),
            chartPrimary,
            chartPrimarySoft,
            chartAreaFill,
            chartGradientStart,
            chartGradientEnd,
            scatterPalette: isAdidas ? adidasScatterPalette : isAmazon ? amazonScatterPalette : isRestaurant ? restaurantScatterPalette : isLogistics ? logisticsScatterPalette : defaultScatterPalette,
            scatterOtherColor: isAdidas ? (isDark ? "#7d7d7d" : "#9a9a9a") : isAmazon ? (isDark ? "#8f9db2" : "#8ca0ba") : isRestaurant ? (isDark ? "#d8cbb8" : "#8f7150") : isLogistics ? (isDark ? "#d9dde3" : "#6f737a") : "#7b93a8",
            heatmapScale: isAdidas ? adidasHeatmapScale : isAmazon ? amazonHeatmapScale : isRestaurant ? restaurantHeatmapScale : isLogistics ? logisticsHeatmapScale : defaultHeatmapScale,
            piePalette: isAdidas ? adidasPiePalette : isAmazon ? amazonPiePalette : isRestaurant ? restaurantPiePalette : isLogistics ? logisticsPiePalette : defaultPiePalette,
            statusPalette: isAdidas ? adidasStatusPalette : isAmazon ? amazonStatusPalette : isRestaurant ? restaurantStatusPalette : isLogistics ? logisticsStatusPalette : defaultStatusPalette,
            mapText: isAmazon ? (isDark ? "#d3dded" : "#4e5664") : isRestaurant ? (isDark ? "#d8cbb8" : "#5a2e2e") : isLogistics ? (isDark ? "#ffffff" : "#111111") : (isDark ? "#bfeee7" : "#4b5563"),
            mapArea: isAmazon ? (isDark ? "#1a2430" : "#edf2f8") : isRestaurant ? (isDark ? "#241b16" : "#f6f1ea") : isLogistics ? (isDark ? "#16181d" : "#fdebed") : (isDark ? "#173634" : "#e8eef5"),
            mapBorder: isAmazon ? (isDark ? "rgba(137,191,255,0.18)" : "#c5ccd4") : isRestaurant ? (isDark ? "rgba(200,169,107,0.22)" : "#d8cbb8") : isLogistics ? (isDark ? "rgba(217,4,41,0.24)" : "#d9dde3") : (isDark ? "rgba(191, 238, 231, 0.18)" : "#c5ccd4"),
            mapEmphasisLabel: isAmazon ? (isDark ? "#fff1d6" : "#111111") : isRestaurant ? (isDark ? "#f8f6f2" : "#2a211b") : isLogistics ? (isDark ? "#ffffff" : "#111111") : (isDark ? "#eafffb" : "#0e4946"),
            mapEmphasisArea: isAmazon ? (isDark ? "#395477" : "#ffd18a") : isRestaurant ? (isDark ? "#5a2e2e" : "#c8a96b") : isLogistics ? (isDark ? "#d90429" : "#d90429") : (isDark ? "#2b7f77" : "#9ddfd6"),
            pieLegend: isAdidas ? (isDark ? "#d9d9d9" : "#4f4f4f") : isAmazon ? (isDark ? "#dbe7f5" : "#5b6472") : isRestaurant ? (isDark ? "#d8cbb8" : "#5a2e2e") : isLogistics ? (isDark ? "#d9dde3" : "#111111") : (isDark ? "#b7d8d4" : "#4b5864"),
            pieLabel: isAdidas ? (isDark ? "#f5f5f5" : "#2e3642") : isAmazon ? (isDark ? "#f8fafc" : "#1f2937") : isRestaurant ? (isDark ? "#f8f6f2" : "#2a211b") : isLogistics ? (isDark ? "#ffffff" : "#111111") : (isDark ? "#e6fbf8" : "#2e3642"),
            pieLabelLine: isAdidas ? (isDark ? "rgba(255,255,255,0.26)" : "rgba(0,0,0,0.25)") : isAmazon ? (isDark ? "rgba(137,191,255,0.32)" : "rgba(91,100,114,0.26)") : isRestaurant ? (isDark ? "rgba(200,169,107,0.34)" : "rgba(90,46,46,0.22)") : isLogistics ? (isDark ? "rgba(217,4,41,0.34)" : "rgba(17,17,17,0.24)") : (isDark ? "rgba(191, 238, 231, 0.34)" : "rgba(0,0,0,0.25)"),
            chartLabelStrong: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : isAmazon
                    ? (isDark ? "#f8fafc" : "#1f2937")
                    : isRestaurant
                        ? (isDark ? "#f8f6f2" : "#2a211b")
                        : isLogistics
                            ? (isDark ? "#ffffff" : "#111111")
                            : (isDark ? "#dff5f1" : "#171515")
        };
    }, [theme]);
};