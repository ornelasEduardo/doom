import "../../styles/globals.scss";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Dashboards } from "./Dashboards";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Dashboards />
  </StrictMode>,
);
