import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import "./styles.css";

// The service worker is only for the installed web app. Development builds
// and the native Android/iOS app (Capacitor) do not use it.
const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
if (import.meta.env.PROD && !isNativeApp && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
