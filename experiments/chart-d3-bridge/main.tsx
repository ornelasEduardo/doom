import "../../styles/globals.scss";

import React from "react";
import { createRoot } from "react-dom/client";

import { Proof } from "./Proof";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Proof
      initialCount={
        [
          8, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
        ].includes(Number(new URLSearchParams(location.search).get("points")))
          ? Number(new URLSearchParams(location.search).get("points"))
          : 1000
      }
      initialEncoding={
        new URLSearchParams(location.search).get("projection") === "cpu"
          ? "projected"
          : "raw"
      }
    />
  </React.StrictMode>,
);
