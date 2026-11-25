import { palette } from "../../palettes";
import { createSolidTokens } from "../solid-tokens";

export const doomDefinition = {
  name: "DOOMSDAY",
  variables: {
    "--accent": palette.red[500],
    "--background": palette.slate[950],
    "--border-strong": palette.slate[700],
    "--card-bg": palette.slate[900],
    "--card-border": palette.slate[800],
    "--error": palette.red[500],
    "--error-foreground": palette.black[950],
    "--foreground": palette.slate[200],
    "--muted": palette.slate[500],
    "--muted-foreground": palette.slate[400],
    "--on-surface": palette.slate[200],
    "--on-surface-muted": palette.slate[400],
    "--primary": palette.green[600],
    "--primary-foreground": palette.slate[950],
    "--surface-brand": palette.green[600],
    "--surface-brand-foreground": palette.slate[950],
    "--primary-hover": palette.green[700],
    "--secondary": palette.slate[600],
    "--secondary-foreground": palette.slate[50],
    "--shadow-base": palette.black[950],
    "--shadow-error": palette.red[800],
    "--shadow-primary": palette.green[900],
    "--success": palette.green[600],
    "--success-foreground": palette.slate[950],
    "--surface-accent": palette.slate[900],
    "--warning": palette.yellow[500],
    "--warning-foreground": palette.slate[950],
  },
  solid: /* @__PURE__ */ createSolidTokens(
    palette.green[600],
    palette.black[950],
    {
      success: palette.green[600],
      error: palette.red[500],
      warning: palette.yellow[500],
    },
  ),
} as const;
