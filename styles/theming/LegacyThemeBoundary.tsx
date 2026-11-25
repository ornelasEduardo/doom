"use client";
import React from "react";

import type { ThemeKey } from "../themes/definitions";
import {
  captainTheme,
  doomsdayTheme,
  neubrutalistTheme,
  orbitalTheme,
  vigilanteTheme,
} from "../themes/presets";
import { ThemeScope } from "./ThemeScope";

const presets = {
  default: neubrutalistTheme,
  doom: doomsdayTheme,
  captain: captainTheme,
  vigilante: vigilanteTheme,
  orbital: orbitalTheme,
};
export function LegacyThemeBoundary({
  theme,
  nonce,
  children,
}: {
  theme: ThemeKey;
  nonce?: string;
  children: React.ReactNode;
}) {
  return (
    <ThemeScope
      _legacy
      className="doom-legacy-scope"
      nonce={nonce}
      theme={presets[theme]}
    >
      {children}
    </ThemeScope>
  );
}
