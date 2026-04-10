import React from "react";
import Dashboard from "./dashboard";

const App = () => {
  return (
    <main className="app-shell">
      <section className="app-shell__hero">
        <div>
          <p className="app-shell__eyebrow">André Pimentel Santos /@andrepimentelsantos01</p>
          <h1>Demonstração Dashboard Corporativo</h1>
          <p>
            Esta versao roda com servicos mockados e
            dados locais no mesmo formato esperado por uma API REST.
          </p>
        </div>
      </section>

      <section className="app-shell__content">
        <Dashboard />
      </section>
    </main>
  );
};

export default App;
