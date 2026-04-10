import { useEffect, useMemo, useState } from "react";

const getCurrentTheme = () => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
};

export const useChartTheme = () => {
    const [theme, setTheme] = useState(getCurrentTheme);

    useEffect(() => {
        if (typeof document === "undefined") return undefined;

        const root = document.documentElement;
        const observer = new MutationObserver(() => {
            setTheme(getCurrentTheme());
        });

        observer.observe(root, {
            attributes: true,
            attributeFilter: ["data-theme"]
        });

        return () => observer.disconnect();
    }, []);

    return theme;
};

export const useChartThemeTokens = () => {
    const theme = useChartTheme();

    return useMemo(() => {
        const isDark = theme === "dark";

        return {
            isDark,
            textPrimary: isDark ? "#dff5f1" : "#143f3d",
            textSecondary: isDark ? "#9bc3be" : "#4b5864",
            axisLine: isDark ? "rgba(191, 238, 231, 0.28)" : "rgba(0,0,0,0.35)",
            splitLine: isDark ? "rgba(191, 238, 231, 0.12)" : "rgba(0,0,0,0.08)",
            sliderFill: isDark ? "rgba(111, 213, 200, 0.2)" : "rgba(25, 181, 159, 0.18)",
            mapText: isDark ? "#bfeee7" : "#4b5563",
            mapArea: isDark ? "#173634" : "#e8eef5",
            mapBorder: isDark ? "rgba(191, 238, 231, 0.18)" : "#c5ccd4",
            mapEmphasisLabel: isDark ? "#eafffb" : "#0e4946",
            mapEmphasisArea: isDark ? "#2b7f77" : "#9ddfd6",
            pieLegend: isDark ? "#b7d8d4" : "#4b5864",
            pieLabel: isDark ? "#e6fbf8" : "#2e3642",
            pieLabelLine: isDark ? "rgba(191, 238, 231, 0.34)" : "rgba(0,0,0,0.25)",
            chartLabelStrong: isDark ? "#dff5f1" : "#171515"
        };
    }, [theme]);
};
