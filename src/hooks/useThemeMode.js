import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dashboard-theme-mode";

const getPreferredTheme = () => {
    return "light";
};

export const useThemeMode = () => {
    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    useEffect(() => {
        return undefined;
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
