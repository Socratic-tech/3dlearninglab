import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { App } from "./App";

import { applyPrefs, loadPrefs } from "./display";
import { applySkin, savedSkin } from "./skins";

// apply saved display & reading settings (and the student's unlocked look) before first paint
applyPrefs(loadPrefs());
applySkin(savedSkin());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
