export type SolidSemantics = {
  success: string;
  error: string;
  warning: string;
};

/**
 * Creates a complete set of solid variant tokens from minimal inputs.
 *
 * @param bg - Solid background color (typically theme's primary)
 * @param fg - Solid foreground color (contrasts with bg)
 * @param semantics - Semantic colors tuned for the solid background
 * @returns Complete solid token object
 */
export function createSolidTokens(
  bg: string,
  fg: string,
  semantics: SolidSemantics,
) {
  return {
    // Primitives
    "--solid-bg": bg,
    "--solid-fg": fg,

    // Semantics
    "--solid-success": semantics.success,
    "--solid-error": semantics.error,
    "--solid-warning": semantics.warning,
  };
}

export type SolidTokens = ReturnType<typeof createSolidTokens>;
