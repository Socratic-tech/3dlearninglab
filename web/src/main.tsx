import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";

import { applyPrefs, loadPrefs } from "./display";

// apply saved display & reading settings before first paint
applyPrefs(loadPrefs());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
