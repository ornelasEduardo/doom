import { orbitalTheme } from "./orbital";
import { captainDefinition } from "./presets/captainDefinition";
import { defaultDefinition } from "./presets/defaultDefinition";
import { doomDefinition } from "./presets/doomDefinition";
import { vigilanteDefinition } from "./presets/vigilanteDefinition";

export const themes = {
  orbital: orbitalTheme,
  default: defaultDefinition,
  doom: doomDefinition,
  captain: captainDefinition,
  vigilante: vigilanteDefinition,
} as const;

export type ThemeKey = keyof typeof themes;
