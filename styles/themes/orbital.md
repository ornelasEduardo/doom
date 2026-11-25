# Orbital

Built-in warm aerospace theme for conversation-led financial workspaces.

```tsx
<DesignSystemProvider initialTheme="orbital">
  <App />
</DesignSystemProvider>
```

Ivory surfaces, tobacco text, oxide actions, and matte aluminum accents. The theme supplies complete semantic colors, chart series, geometry, control/label typography, motion, focus, and disabled-state tokens. Existing themes retain their CSS fallback behavior.

## Appearance contracts

- Control text uses `--control-text-transform`, `--control-font-weight`, and `--control-letter-spacing`.
- Labels use `--label-text-transform`, `--label-letter-spacing`, and `--label-font-weight`.
- Shared mixins consume `--control-hover-transform`, `--control-press-transform`, `--control-focus-transform`, `--control-focus-shadow`, `--control-focus-outline`, `--control-focus-outline-offset`, and `--control-disabled-background`.
- Buttons additionally consume `--control-ghost-press-transform` and `--control-hover-filter`.
- Focus rings are distinct from decorative shadows. Orbital removes lift and hatch effects but retains visible keyboard focus.
- Material/context tokens include `--material-metal`, `--material-metal-edge`, `--surface-navigation`, `--on-navigation`, `--on-navigation-muted`, `--surface-selection`, `--on-selection`, `--surface-readout`, `--on-readout`, and `--on-readout-muted`.

The theme does not load a font, implement application navigation, or define financial behavior. Products may use Montserrat selectively with a system-sans conversation body. Prefer a filled current-navigation state over decorative accent stripes; keep filters separate from metric readouts.

ThemeProvider remains document-global. Scoped theme roots and themed portal containers are not introduced by this theme. Components outside the inspected shared mixins may retain component-specific behavior and require separate review.

Validation: Orbital registration and theme switching tests; existing provider/button/label tests; actual-package consumer browser checks. The standard build currently encounters an unrelated duplicated Chart test type error; the theme was also built with a temporary exclusion of duplicated source files. Resolve that packaging issue before publishing a release. Do not publish the temporary build as a release artifact.
