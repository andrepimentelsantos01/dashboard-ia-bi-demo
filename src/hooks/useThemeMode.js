import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dashboard-theme-mode";
const THEME_MODES = new Set(["light", "dark"]);
const subscribers = new Set();
let currentTheme = "light";

const readStoredTheme = () => {
    if (typeof window === "undefined") return null;

    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

const writeStoredTheme = (theme) => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Theme persistence is optional; DOM state remains the source of truth.
    }
};

const getPreferredTheme = () => {
    if (typeof window === "undefined") return currentTheme;

    const storedTheme = readStoredTheme();
    if (THEME_MODES.has(storedTheme)) {
        currentTheme = storedTheme;
        return storedTheme;
    }

    const domTheme = document.documentElement.getAttribute("data-theme");
    if (THEME_MODES.has(domTheme)) {
        currentTheme = domTheme;
        return domTheme;
    }

    return currentTheme;
};

const publishTheme = (theme) => {
    currentTheme = THEME_MODES.has(theme) ? theme : "light";

    if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", currentTheme);
    }

    writeStoredTheme(currentTheme);

    subscribers.forEach((listener) => listener(currentTheme));
};

export const useThemeMode = () => {
    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        subscribers.add(setTheme);
        publishTheme(getPreferredTheme());

        return () => {
            subscribers.delete(setTheme);
        };
    }, []);

    const toggleTheme = useCallback(() => {
        publishTheme(currentTheme === "dark" ? "light" : "dark");
    }, []);

    return useMemo(() => ({
        theme,
        isDark: theme === "dark",
        toggleTheme
    }), [theme, toggleTheme]);
};
