import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dashboard-theme-mode";

const getPreferredTheme = () => {
    if (typeof window === "undefined") return "light";

    const persistedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (persistedTheme === "light" || persistedTheme === "dark") {
        return persistedTheme;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

export const useThemeMode = () => {
    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mediaQuery) return undefined;

        const handleSystemThemeChange = (event) => {
            const persistedTheme = window.localStorage.getItem(STORAGE_KEY);
            if (persistedTheme === "light" || persistedTheme === "dark") return;

            setTheme(event.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener?.("change", handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
        };
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
    }, []);

    return useMemo(() => ({
        theme,
        isDark: theme === "dark",
        toggleTheme
    }), [theme, toggleTheme]);
};

