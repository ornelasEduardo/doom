import { palette } from "../../palettes";
import { createSolidTokens } from "../solid-tokens";

export const defaultDefinition = {
  name: "Default",
  variables: {
    "--accent": palette.red[500],
    "--background": palette.indigo[100],
    "--border-strong": palette.black[950],
    "--card-bg": palette.white[950],
    "--card-border": palette.black[950],
    "--error": palette.red[500],
    "--error-foreground": palette.black[950],
    "--foreground": palette.black[950],
    "--muted": palette.gray[400],
    "--muted-foreground": palette.gray[700],
    "--on-surface": palette.black[950],
    "--on-surface-muted": palette.gray[700],
    "--primary": palette.purple[500],
    "--primary-foreground": palette.black[950],
    "--surface-brand": palette.purple[500],
    "--surface-brand-foreground": palette.black[950],
    "--primary-hover": palette.purple[600],
    "--secondary": palette.yellow[400],
    "--secondary-foreground": palette.black[950],
    "--shadow-base": palette.black[950],
    "--shadow-error": palette.red[800],
    "--shadow-primary": palette.purple[800],
    "--success": palette.green[500],
    "--success-foreground": palette.black[950],
    "--surface-accent": palette.slate[100],
    "--warning": palette.yellow[500],
    "--warning-foreground": palette.black[950],
  },
  solid: /* @__PURE__ */ createSolidTokens(
    palette.purple[500],
    palette.black[950],
    {
      success: palette.green[500],
      error: palette.red[500],
      warning: palette.yellow[500],
    },
  ),
} as const;
