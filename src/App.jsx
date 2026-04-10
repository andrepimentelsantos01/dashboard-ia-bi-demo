import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
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
            <p>
              Esta versao roda com servicos mockados e
              dados locais no mesmo formato esperado por uma API REST.
            </p>
          </div>

          <button
            type="button"
            className="app-shell__theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {isDark ? <FiSun /> : <FiMoon />}
            <span>{isDark ? "Tema claro" : "Tema escuro"}</span>
          </button>
        </div>
      </section>

      <section className="app-shell__content">
        <Dashboard />
      </section>
    </main>
  );
};

export default App;
