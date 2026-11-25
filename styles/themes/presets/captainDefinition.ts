import { palette } from "../../palettes";
import { createSolidTokens } from "../solid-tokens";

export const captainDefinition = {
  name: "THE CAPTAIN",
  variables: {
    "--accent": palette.red[600],
    "--background": palette.slate[50],
    "--border-strong": palette.slate[900],
    "--card-bg": palette.white[950],
    "--card-border": palette.black[950],
    "--error": palette.red[600],
    "--error-foreground": palette.white[950],
    "--foreground": palette.slate[900],
    "--muted": palette.slate[400],
    "--muted-foreground": palette.slate[600],
    "--on-surface": palette.slate[900],
    "--on-surface-muted": palette.slate[600],
    "--primary": palette.blue[500],
    "--primary-foreground": palette.black[950],
    "--surface-brand": palette.blue[500],
    "--surface-brand-foreground": palette.black[950],
    "--primary-hover": palette.blue[600],
    "--secondary": palette.slate[500],
    "--secondary-foreground": palette.white[950],
    "--shadow-base": palette.black[950],
    "--shadow-error": palette.red[900],
    "--shadow-primary": palette.blue[800],
    "--success": palette.green[600],
    "--success-foreground": palette.black[950],
    "--surface-accent": palette.slate[100],
    "--warning": palette.yellow[600],
    "--warning-foreground": palette.gray[950],
  },
  solid: /* @__PURE__ */ createSolidTokens(
    palette.blue[500],
    palette.black[950],
    {
      success: palette.green[600],
      error: palette.red[600],
      warning: palette.yellow[600],
    },
  ),
} as const;
