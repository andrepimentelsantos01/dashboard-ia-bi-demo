import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/app.css";

const withSilencedStartupNoise = async (callback) => {
  const originalInfo = console.info.bind(console);
  const originalLog = console.log.bind(console);

  const shouldSuppress = (message) =>
    typeof message === "string" && (
      message.includes("Download the React DevTools") ||
      message.includes("Locize") ||
      message.includes("locize.com")
    );

  console.info = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalInfo(...args);
  };

  console.log = (...args) => {
    if (shouldSuppress(args[0])) return;
    originalLog(...args);
  };

  try {
    await callback();
  } finally {
    console.info = originalInfo;
    console.log = originalLog;
  }
};

withSilencedStartupNoise(async () => {
  const [{ createRoot }, { default: App }] = await Promise.all([
    import("react-dom/client"),
    import("./App"),
    import("./i18n")
  ]);

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((error) => {
  console.error(error);
});
