# Theme a Doom application

Install `doom-design-system` with its React, React DOM, and Lucide peer dependencies. The default provider preserves Doom's purple neubrutalist appearance. To use a different visual identity, define a theme in an application module and pass it to the provider.

```tsx
import { Button, DesignSystemProvider } from "doom-design-system";
import { defineTheme } from "doom-design-system/theme";

export const studio = defineTheme({
  name: "Studio",
  foundations: { fonts: { body: "Georgia, serif" }, radii: { control: "8px" } },
  roles: { canvas: "#faf9f6", brand: "#315d50", onBrand: "white" },
  defaults: { controls: { radius: "{radii.control}", fontWeight: 500 } },
  components: {
    Button: {
      parts: { label: { letterSpacing: "0.02em" } },
      variants: { primary: { root: { backgroundColor: "{roles.brand}" } } },
      sizes: { sm: { root: { paddingInline: "14px" } } },
    },
  },
});

export function App() {
  return (
    <DesignSystemProvider theme={studio} withBackground>
      <Button variant="primary" size="sm">
        Save changes
      </Button>
    </DesignSystemProvider>
  );
}
```

A definition starts from the neutral theme. To preserve an existing preset, supply `extends`. The exports from `doom-design-system/themes` map to the legacy keys as follows.

| Legacy key | Object preset     |
| ---------- | ----------------- |
| default    | neubrutalistTheme |
| doom       | doomsdayTheme     |
| captain    | captainTheme      |
| vigilante  | vigilanteTheme    |
| orbital    | orbitalTheme      |

The presets also have individual module entry points such as `doom-design-system/themes/orbital` and `doom-design-system/themes/neubrutalist`. These subpaths instantiate only the requested preset.

## Tokens, recipes and classes

Foundations supply primitive design values, roles express semantic meanings, and defaults coordinate related components. References such as `{roles.focus}` work inside values such as `"2px solid {roles.focus}"`. Define project-specific tokens under `extensions`. Import `tokenVariable` from the theme entry point to convert a token path to its CSS variable name. Token names, neutral values, mapped legacy properties, parts, sizes and variants are listed in the [reference](THEME-REFERENCE.md).

Inherited objects merge by key, arrays replace inherited arrays, and omitted or undefined values inherit. CSS values such as `none` remove an effect. `replace: true` on a component discards inherited recipes and classes for that component. Declare lengths with units. Recipe declarations apply in base, size, variant, then matching compound order. Each compound has a `when` containing registered size or variant values and a `parts` object. State declarations follow base declarations in this order: hover, pressed, checked, selected, expanded, invalid, loading, disabled, focusVisible. Each state requires a corresponding native, ARIA or Doom state on the target. For example, give Button’s root a focus-visible ring. A label span does not receive focus independently.

Selected recipes match ARIA selection, an active ARIA current token, or a Doom selection marker. Checkbox, Switch and RadioGroup also expose native checked, focus-visible, invalid and disabled state to their indicators. Pressed styles follow native activation or explicit pressed state on that control.

A theme can attach CSS Modules classes with `components.Button.classNames`. Parent and child classes accumulate. Add instance-specific classes with `<Button classNames={{ label: styles.price }}>Buy</Button>`. Put reusable classes in `@layer doom.theme`. A consumer's unlayered CSS overrides normal declarations in Doom's reset, utilities, components and theme layers. Use a class on the part itself for media queries, pseudo-elements and custom animations. Scoped part hooks include `data-doom-component`, `data-doom-part`, and `data-doom-theme`. Composed components can attach multiple part classes to one element.

## Switch themes and modes

Change the controlled `theme` prop with application state. Children keep their local state as the theme changes. Read the effective identity, mode, surface, variables and recipes with `useResolvedTheme()`. A `ThemeScope theme={other}` selects a complete theme. A `ThemeScope overrides={{ roles: { brand: "#326657" } }}` derives from the nearest provider.

```tsx
const dayNight = defineTheme({
  name: "Reader",
  extends: studio,
  defaultMode: "light",
  modes: {
    light: {},
    dark: {
      roles: { canvas: "#151714", surface: "#20231f", foreground: "#faf9f6" },
    },
  },
});
// Inside a component:
<DesignSystemProvider theme={dayNight} mode="system" withBackground>
  <Reader />
</DesignSystemProvider>;
```

Mode patches apply after theme inheritance. An explicit theme starts in its default mode. A derived scope inherits its owner's mode. System mode requires light and dark patches and observes the browser preference after hydration. The server and initial client render use the declared default mode. To avoid an initial color change, resolve a user preference on the server (for example from a preference cookie) and pass that explicit mode to both renders.

## Scopes, surfaces and portals

Object scopes establish tokens and typography on a wrapper. Use `asChild` on ThemeScope with one element that forwards attributes and classes when an extra wrapper would invalidate a table or list. `withBody` makes the provider own the body and belongs directly under html. `withBackground` paints the canvas. Object providers leave document-wide reset policy to the application.

Doom overlays carry their React owner's theme, mode, and configured `dir`. Set `portalContainer` on the provider or scope to choose a connected element in the current document’s light DOM. Descendants inherit that selection, and a null container restores the document body. Mounting into a shadow tree, iframe document, detached element or document fragment raises an error when the overlay mounts. Express local changes with `ThemeScope overrides` when a portal needs them. Ordinary ancestor CSS variables and descendant selectors follow physical DOM ancestry. A ToastProvider owns the appearance of its notification region. Place separate providers inside independently themed regions.

Solid and inverted contexts are finite patches of the current mode. A nested context selects its own patch. To theme a custom surface and the overlays it opens, use `<ThemeScope surface="solid">` or `surface="inverted"`. Provider `icons` maps semantic names such as `close`, `check` and `chevronDown` to React components. Forward the supplied SVG props, including accessibility attributes, class name and stroke width.

## Server rendering and CSP

The DOM-free theme entry point can define and compile themes during a build. Runtime providers include styles in the initial HTML. Pass `nonce` for an inline-style CSP and include that nonce in the response's style policy. A nonce on a style element covers that element only. Components that compute geometry can use inline style attributes.

To deliver theme CSS as a static asset, compile the themes your application can select during the build.

```ts
import { writeFileSync } from "node:fs";
import { compileTheme } from "doom-design-system/theme";

const assets = [studio, dayNight].map(compileTheme);
writeFileSync("public/reader-themes.css", assets.map((a) => a.css).join("\n"));
writeFileSync(
  "src/theme-manifest.json",
  JSON.stringify(assets.flatMap((a) => a.manifest)),
);
```

Load the resulting stylesheet in the document before the application. Import its JSON manifest into the app and pass `styleStrategy="external" styleManifest={manifest}` on the object provider. Each asset includes every declared mode and all three surface contexts. External scopes validate the active identity against the manifest. Predefine derived themes with `defineTheme({ name, extends, ...patch })` and compile those too. Use an explicit `theme` for nested external scopes. CSS Modules referenced by class name load through your normal stylesheet pipeline.

## Migrate existing applications

1. Keep a single legacy root while migrating. `initialTheme="captain"` and `useTheme().setTheme("orbital")` preserve string switching and document canvas/reset behavior.
2. Move the selected preset into application state. Replace `initialTheme="captain"` with `theme={captainTheme}` and update that prop to switch. Use `useResolvedTheme()` inside object scopes.
3. Replace a legacy CSS override such as `--primary` with a `roles.brand` patch and set its paired `roles.onBrand`. The legacy path accepts old names as inputs. Object themes emit old names as compatibility aliases. The [token reference](THEME-REFERENCE.md) lists mappings; inspect shadows, surface contexts, and overrides that relied on selectors inherited through the old document root.
4. Move selectors targeting generated module names onto documented parts, or use `classNames` for per-instance styles. Use `surface="solid"` for custom compound surfaces that own overlays. Set the provider's direction explicitly for RTL portal content.
5. Check text and control contrast, visible keyboard focus, pressed/selected/disabled distinctions, reduced motion, and forced colors under every application mode. Include actual overlays, long text, and narrow or zoomed layouts in this review. Consumer themes control foreground/background pairs and can change their contrast.

## Built-in accessibility checks

Chromium checks on each preset verified a visible Button keyboard outline of at least 2px in forced colors mode and a transition below 1ms under reduced motion. A static check measured foreground/canvas, mutedForeground/canvas and paired brand, danger, success, warning, selection, navigation and readout roles. The minimum default-surface contrast across these nine pairs was 5.31:1 for Neubrutalist, 5.58:1 for Doomsday, 5.71:1 for Captain, 6.93:1 for Vigilante, and 6.33:1 for Orbital. Hover, disabled, and derived surface contexts require separate evaluation.

## Replacing indicators

Use the component render callbacks for a project-specific indicator. Spread the supplied `props` onto its decorative element so its theme classes, part identity, and accessible presentation follow the component.

```tsx
<Button loading size="lg" renderLoadingIndicator={({ props, size }) => (
  <span {...props} style={{ fontSize: size === "lg" ? "1.5em" : "1em" }}>…</span>
)}>Save draft</Button>

<Checkbox label="Include attachments" renderIndicator={({ props, checked, indeterminate, size }) => (
  <svg {...props} width={size} height={size} viewBox="0 0 24 24">
    {indeterminate ? <path d="M4 12h16" stroke="currentColor" /> :
      checked ? <circle cx="12" cy="12" r="7" fill="currentColor" /> : null}
  </svg>
)} />
```

Button calls the renderer while loading and supplies its control size and effective disabled state. Checkbox supplies the icon size in pixels and the checked, indeterminate, and disabled states. Its native input retains focus, label association, and form behavior.

## Package sizes

A minified ESM build using esbuild and Node gzip measured the public compiler and definition functions at 45,997 bytes (13,616 gzip). The individual Orbital entry measured 48,628 bytes (14,146 gzip), Captain 49,199 bytes (14,670 gzip), and the aggregate preset entry 54,556 bytes (15,766 gzip). Each measurement bundles a standalone entry and includes its shared resolver. A one-mode compiled CSS asset, including the default, solid and inverted contexts, measured 34,200–36,436 bytes (4,088–4,285 gzip) across the neutral theme and five presets. Application recipes and additional modes change these sizes.

## Design rationale and related APIs

Doom keeps interaction and functional layout in components and exposes appearance through tokens, recipes, and named parts. `defineTheme` starts neutral; Neubrutalist is a preset. This supports radically different visual identities without introducing a separate headless package.

| Reference                                                                                           | Decision in Doom                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [Radix Primitives styling](https://www.radix-ui.com/primitives/docs/guides/styling)                 | Public parts and state hooks; Doom additionally retains functional layout.                                                                |
| [AG Grid theme parts](https://www.ag-grid.com/javascript-data-grid/theming-parts/)                  | Replaceable appearance, with an explicit migration path for legacy themes. AG Grid's reusable theme modules differ from Doom's DOM parts. |
| [Mantine Styles API](https://mantine.dev/styles/styles-api/)                                        | The same named elements accept theme-wide and per-instance classes.                                                                       |
| [Chakra slot recipes](https://chakra-ui.com/docs/theming/slot-recipes)                              | Coordinate base, variant, size and compound styles across multiple parts.                                                                 |
| [React Aria styling](https://react-aria.adobe.com/styling)                                          | Expose semantic interaction state instead of requiring private class selectors.                                                           |
| [vanilla-extract contracts](https://vanilla-extract.style/documentation/api/create-theme-contract/) | Keep the token contract independent from preset values.                                                                                   |
| [Material UI theme components](https://mui.com/material-ui/customization/theme-components/)         | Measure bundled theme costs and provide individual preset entry points.                                                                   |
| [Panda slot recipes](https://panda-css.com/docs/recipes/slot-recipes)                               | Offer compiled CSS assets without requiring a consumer bundler plugin.                                                                    |

Define stable themes outside render. Resolution and compilation cache immutable assets; repeated component instances do not expand their stylesheet. React deduplicates non-nonced runtime style resources and may retain them after a scope unmounts. Nonced scopes use ordinary style elements to preserve the supplied nonce, so independent sibling scopes can repeat that asset. Prefer an external compiled stylesheet for many independent nonced scopes or applications that generate many different themes. Inline `overrides` are convenient for a few derived scopes; predefine frequently reused derived themes.
