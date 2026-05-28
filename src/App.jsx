import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import AiAssistantWidget from "./components/AiAssistantWidget";
import Dashboard from "./dashboard";
import { useThemeMode } from "./hooks/useThemeMode";

const App = () => {
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <main className="app-shell">
      <section className="app-shell__hero">
        <div className="app-shell__hero-content">
          <div>
            <p className="app-shell__eyebrow">Andre Pimentel Santos /@andrepimentelsantos01</p>
            <h1>Demonstracao Dashboard Corporativo</h1>
          </div>

          <button
            type="button"
            className="app-shell__theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </section>

      <section className="app-shell__content">
        <Dashboard />
      </section>

      <AiAssistantWidget />
    </main>
  );
};

export default App;
