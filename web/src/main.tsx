import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";

// apply saved theme before first paint
try {
  const t = localStorage.getItem("academy.theme");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch { /* ignore */ }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
