import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/archivo-narrow";
import "@fontsource-variable/source-sans-3";
import "./style.css";
import "./responsive.css";
import "./trajectories.css";
import App from "./App";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
