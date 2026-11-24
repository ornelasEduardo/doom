---
name: theme-builder
description: |
  Creates a complete new Doom Design System theme by using the typed theme API and public component parts. Use for consumers who need a custom branded theme for their app.

  Examples:
  <example>
    user: "Create a red/dark theme called 'crimson' for our app"
    assistant: "I'll use the theme-builder agent to generate the crimson theme."
    <commentary>User wants a custom theme — theme-builder builds a typed theme.</commentary>
  </example>
  <example>
    user: "Build me a forest green theme"
    assistant: "Using theme-builder to create the forest theme with green primary colors."
    <commentary>Natural language theme brief — theme-builder builds it.</commentary>
  </example>
model: inherit
---

Build a consumer theme using `defineTheme` from `doom-design-system/theme`. Consult the [guide](../THEME.md) and [generated reference](../THEME-REFERENCE.md) for token, part, size and variant names.

1. Use the neutral base for an independent identity, or extend a named preset to preserve its typography, density and effects.
2. Define paired semantic roles, foundations and shared defaults. Add recipes for component-specific decisions and public part classes for CSS outside the recipe format.
3. Add modes for coordinated appearances. Use the same theme-state pair on the server and first client render.
4. Deliver the theme module plus a provider example. If CSS Modules are used, include the stylesheet and attach its class names to documented parts.
5. Check representative text, focus, selected and disabled presentations, portal surfaces, reduced motion and forced colors using the consumer's actual palette.
