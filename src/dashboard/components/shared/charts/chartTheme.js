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

        const defaultScatterPalette = ["#19b59f", "#159689", "#2f7f7a", "#5aaea6", "#78c8be", "#3a6f91"];
        const adidasScatterPalette = isDark
            ? ["#f5f5f5", "#d6d6d6", "#b5b5b5", "#8e8e8e", "#666666", "#404040"]
            : ["#101010", "#2c2c2c", "#484848", "#6a6a6a", "#919191", "#b8b8b8"];
        const amazonScatterPalette = isDark
            ? ["#ffb84d", "#89bfff", "#ffd18a", "#f7a7a7", "#9ed8c2", "#c8d6f2"]
            : ["#ff9900", "#5b9fff", "#ffb84d", "#f39a8f", "#82c8b7", "#a9c5ee"];
        const restaurantScatterPalette = isDark
            ? ["#efc89f", "#d7b28d", "#c59b73", "#f1d9c6", "#d8b4a0", "#b9895a"]
            : ["#b9895a", "#d7b28d", "#8f6647", "#f4dfce", "#d8b4a0", "#c59b73"];

        const defaultHeatmapScale = ["#d9f4ef", "#8fd8cf", "#43bfae", "#17877e", "#0f4f4c"];
        const adidasHeatmapScale = isDark
            ? ["#f2f2f2", "#cfcfcf", "#9b9b9b", "#616161", "#242424"]
            : ["#f5f5f5", "#d9d9d9", "#adadad", "#6c6c6c", "#1d1d1d"];
        const amazonHeatmapScale = isDark
            ? ["#10161d", "#2b3d57", "#4f78a9", "#ff9900", "#ffd18a"]
            : ["#eef3fb", "#c8d8ef", "#8fb2df", "#ffb84d", "#111111"];
        const restaurantHeatmapScale = isDark
            ? ["#2a211a", "#5a4030", "#8f6647", "#c59b73", "#efc89f"]
            : ["#fbf3ea", "#ecd7c3", "#d7b28d", "#b9895a", "#6e4f3a"];

        const defaultPiePalette = ["#4f86c6", "#2a9d8f", "#f4a261", "#7b6fd6", "#2bb3c0", "#e76f51", "#78d5dd", "#d97b2b", "#8db6f2", "#1f8a70"];
        const adidasPiePalette = isDark
            ? ["#0f3d8a", "#7a1f1f", "#245f45", "#8a6a10", "#f2f2f2", "#444444", "#c7c7c7", "#2c2c2c", "#6d6d6d", "#9d9d9d"]
            : ["#0f3d8a", "#8f2d2d", "#1f6a4b", "#9b7a18", "#111111", "#4f4f4f", "#d9d9d9", "#2a2a2a", "#7d7d7d", "#b8b8b8"];
        const amazonPiePalette = isDark
            ? ["#ffb84d", "#89bfff", "#ff9f7a", "#9ed8c2", "#c7b6ff", "#ffd18a", "#8bb1e8", "#f3c0b9", "#a3cfae", "#f8e3bf"]
            : ["#ff9900", "#5b9fff", "#ffb48a", "#7fd2be", "#a591f2", "#ffd18a", "#8fb6ff", "#f4c3b1", "#a8d8b8", "#ffe2ba"];
        const restaurantPiePalette = isDark
            ? ["#efc89f", "#d7b28d", "#c59b73", "#f1d9c6", "#d8b4a0", "#b9895a", "#f3dfcc", "#8f6647", "#cfa98f", "#a57859"]
            : ["#b9895a", "#d7b28d", "#8f6647", "#f4dfce", "#d8b4a0", "#c59b73", "#ecd7c3", "#6e4f3a", "#e3c4aa", "#b98f6c"];

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
                Atrasado: "#ff9f7a",
                Cancelado: "#f3c0b9",
                Desconhecido: "#a5b4c8",
                Online: "#89bfff",
                Cash: "#ffb84d",
                "Walk-in": "#9ed8c2",
                "Sem status": "#a5b4c8"
            }
            : {
                Entregue: "#5fb48a",
                "Em Trânsito": "#5b9fff",
                Faturado: "#8f7ae8",
                "Em Recebimento": "#ffd18a",
                Pendente: "#ff9900",
                Atrasado: "#ef8f73",
                Cancelado: "#d8a6a0",
                Desconhecido: "#7b8ea6",
                Online: "#5b9fff",
                Cash: "#ff9900",
                "Walk-in": "#7fd2be",
                "Sem status": "#7b8ea6"
            };
        const restaurantStatusPalette = isDark
            ? {
                Entregue: "#efc89f",
                Online: "#d7b28d",
                Cash: "#8f6647",
                "Walk-in": "#f1d9c6",
                Pendente: "#c59b73",
                Atrasado: "#b9895a",
                Cancelado: "#6e4f3a",
                Desconhecido: "#b89d8b",
                "Sem status": "#b89d8b"
            }
            : {
                Entregue: "#b9895a",
                Online: "#d7b28d",
                Cash: "#8f6647",
                "Walk-in": "#f1d9c6",
                Pendente: "#c59b73",
                Atrasado: "#a06d52",
                Cancelado: "#6e4f3a",
                Desconhecido: "#b89d8b",
                "Sem status": "#b89d8b"
            };

        const chartPrimary = isAdidas
            ? (isDark ? "#f3f3f3" : "#171515")
            : isAmazon
                ? "#ff9900"
                : isRestaurant
                    ? "#8f6647"
                    : "#17877e";
        const chartPrimarySoft = isAdidas
            ? (isDark ? "#bcbcbc" : "#707070")
            : isAmazon
                ? (isDark ? "#ffd18a" : "#ffb84d")
                : isRestaurant
                    ? (isDark ? "#efc89f" : "#d7b28d")
                    : "#5aaea6";
        const chartAreaFill = isAdidas
            ? (isDark ? "rgba(243, 243, 243, 0.18)" : "rgba(23, 21, 21, 0.14)")
            : isAmazon
                ? (isDark ? "rgba(255, 153, 0, 0.18)" : "rgba(255, 153, 0, 0.16)")
                : isRestaurant
                    ? (isDark ? "rgba(239, 200, 159, 0.16)" : "rgba(185, 137, 90, 0.16)")
                    : "rgba(23, 135, 126, 0.24)";

        return {
            isDark,
            isAdidas,
            isAmazon,
            isRestaurant,
            schema: theme.schema,
            textPrimary: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : isAmazon
                    ? (isDark ? "#f4f6fb" : "#161616")
                    : isRestaurant
                        ? (isDark ? "#f6eee7" : "#4a3426")
                        : (isDark ? "#dff5f1" : "#143f3d"),
            textSecondary: isAdidas
                ? (isDark ? "#cfcfcf" : "#4f4f4f")
                : isAmazon
                    ? (isDark ? "#c4cfde" : "#4e5664")
                    : isRestaurant
                        ? (isDark ? "#dcbda0" : "#816656")
                        : (isDark ? "#9bc3be" : "#4b5864"),
            axisLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.24)" : "rgba(0,0,0,0.32)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.24)" : "rgba(17,17,17,0.24)")
                    : isRestaurant
                        ? (isDark ? "rgba(239,200,159,0.22)" : "rgba(110,79,58,0.24)")
                        : (isDark ? "rgba(191, 238, 231, 0.28)" : "rgba(0,0,0,0.35)"),
            splitLine: isAdidas
                ? (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.1)" : "rgba(17,17,17,0.08)")
                    : isRestaurant
                        ? (isDark ? "rgba(239,200,159,0.1)" : "rgba(110,79,58,0.08)")
                        : (isDark ? "rgba(191, 238, 231, 0.12)" : "rgba(0,0,0,0.08)"),
            sliderFill: isAdidas
                ? (isDark ? "rgba(255,255,255,0.16)" : "rgba(23,21,21,0.12)")
                : isAmazon
                    ? (isDark ? "rgba(255,153,0,0.18)" : "rgba(255,153,0,0.14)")
                    : isRestaurant
                        ? (isDark ? "rgba(239,200,159,0.16)" : "rgba(185,137,90,0.14)")
                        : (isDark ? "rgba(111, 213, 200, 0.2)" : "rgba(25, 181, 159, 0.18)"),
            chartPrimary,
            chartPrimarySoft,
            chartAreaFill,
            scatterPalette: isAdidas ? adidasScatterPalette : isAmazon ? amazonScatterPalette : isRestaurant ? restaurantScatterPalette : defaultScatterPalette,
            scatterOtherColor: isAdidas ? (isDark ? "#7d7d7d" : "#9a9a9a") : isAmazon ? (isDark ? "#8f9db2" : "#8ca0ba") : isRestaurant ? (isDark ? "#a88e7d" : "#c3aa97") : "#7b93a8",
            heatmapScale: isAdidas ? adidasHeatmapScale : isAmazon ? amazonHeatmapScale : isRestaurant ? restaurantHeatmapScale : defaultHeatmapScale,
            piePalette: isAdidas ? adidasPiePalette : isAmazon ? amazonPiePalette : isRestaurant ? restaurantPiePalette : defaultPiePalette,
            statusPalette: isAdidas ? adidasStatusPalette : isAmazon ? amazonStatusPalette : isRestaurant ? restaurantStatusPalette : defaultStatusPalette,
            mapText: isAmazon ? (isDark ? "#d3dded" : "#4e5664") : isRestaurant ? (isDark ? "#f1d1b0" : "#816656") : (isDark ? "#bfeee7" : "#4b5563"),
            mapArea: isAmazon ? (isDark ? "#1a2430" : "#edf2f8") : isRestaurant ? (isDark ? "#4d382b" : "#f1e4d6") : (isDark ? "#173634" : "#e8eef5"),
            mapBorder: isAmazon ? (isDark ? "rgba(137,191,255,0.18)" : "#c5ccd4") : isRestaurant ? (isDark ? "rgba(239,200,159,0.18)" : "#d8c3ad") : (isDark ? "rgba(191, 238, 231, 0.18)" : "#c5ccd4"),
            mapEmphasisLabel: isAmazon ? (isDark ? "#fff1d6" : "#111111") : isRestaurant ? (isDark ? "#fff3e5" : "#6e4f3a") : (isDark ? "#eafffb" : "#0e4946"),
            mapEmphasisArea: isAmazon ? (isDark ? "#395477" : "#ffd18a") : isRestaurant ? (isDark ? "#8f6647" : "#d7b28d") : (isDark ? "#2b7f77" : "#9ddfd6"),
            pieLegend: isAdidas ? (isDark ? "#d9d9d9" : "#4f4f4f") : isAmazon ? (isDark ? "#d3dded" : "#4e5664") : isRestaurant ? (isDark ? "#f1d1b0" : "#816656") : (isDark ? "#b7d8d4" : "#4b5864"),
            pieLabel: isAdidas ? (isDark ? "#f5f5f5" : "#2e3642") : isAmazon ? (isDark ? "#f4f6fb" : "#2e3642") : isRestaurant ? (isDark ? "#fff3e5" : "#5b3f2e") : (isDark ? "#e6fbf8" : "#2e3642"),
            pieLabelLine: isAdidas ? (isDark ? "rgba(255,255,255,0.26)" : "rgba(0,0,0,0.25)") : isAmazon ? (isDark ? "rgba(255,209,138,0.34)" : "rgba(17,17,17,0.2)") : isRestaurant ? (isDark ? "rgba(239,200,159,0.32)" : "rgba(110,79,58,0.2)") : (isDark ? "rgba(191, 238, 231, 0.34)" : "rgba(0,0,0,0.25)"),
            chartLabelStrong: isAdidas
                ? (isDark ? "#f3f3f3" : "#171515")
                : isAmazon
                    ? (isDark ? "#fff1d6" : "#171515")
                    : isRestaurant
                        ? (isDark ? "#fff3e5" : "#5b3f2e")
                        : (isDark ? "#dff5f1" : "#171515")
        };
    }, [theme]);
};
