import { palette } from "../../palettes";
import { createSolidTokens } from "../solid-tokens";

export const vigilanteDefinition = {
  name: "DARK KNIGHT",
  variables: {
    "--accent": palette.blue[500],
    "--background": palette.gray[950],
    "--border-strong": palette.gray[900],
    "--card-bg": palette.gray[975],
    "--card-border": palette.gray[990],
    "--error": palette.red[700],
    "--error-foreground": palette.black[950],
    "--foreground": "#E8E9ED",
    "--muted": palette.gray[500],
    "--muted-foreground": palette.gray[400],
    "--on-surface": "#E8E9ED",
    "--on-surface-muted": palette.gray[400],
    "--primary": palette.yellow[600],
    "--primary-foreground": palette.gray[950],
    "--surface-brand": palette.yellow[600],
    "--surface-brand-foreground": palette.gray[950],
    "--primary-hover": palette.yellow[700],
    "--secondary": palette.gray[600],
    "--secondary-foreground": "#E8E9ED",
    "--shadow-base": palette.black[950],
    "--shadow-error": palette.red[900],
    "--shadow-primary": palette.yellow[900],
    "--success": palette.green[400],
    "--success-foreground": palette.gray[950],
    "--surface-accent": palette.gray[900],
    "--warning": palette.yellow[700],
    "--warning-foreground": palette.gray[950],
  },
  solid: /* @__PURE__ */ createSolidTokens(
    palette.yellow[600],
    palette.gray[950],
    {
      success: palette.green[400],
      error: palette.red[700],
      warning: palette.yellow[700],
    },
  ),
} as const;
