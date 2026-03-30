# Sizing Harmonics & CSS Layer Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Doom's ad-hoc sizing with a harmonic token system (primitive/semantic split), wrap all styles in CSS layers, and migrate every component.

**Architecture:** Two new SCSS partials (`_primitives.scss`, `_semantic.scss`) replace `_tokens.scss`. Mixins are rewritten to consume only semantic tokens. Every component SCSS wraps in `@layer doom.components`. A shared `ControlSize` TypeScript type standardizes the size prop.

**Tech Stack:** SCSS (existing), CSS `@layer` (native), TypeScript, Vitest

---

## File Structure

### New files
- `styles/_primitives.scss` — raw scale values (spacing, sizes, type, shadow, radius, weights, motion, z-index)
- `styles/_semantic.scss` — purpose-named tokens pointing to primitives (control, surface, feedback, display)
- `styles/types.ts` — shared `ControlSize` type

### Modified files
- `styles/globals.scss` — layer order declaration, import updates
- `styles/_mixins.scss` — rewrite to use semantic tokens only
- `styles/_reset.scss` — wrap in `@layer doom.reset`, 14px default body font
- `styles/_utilities.scss` — wrap in `@layer doom.utilities`, regenerate from primitive scale
- `styles/palettes.ts` — remove `baseVariables` export (border-strong moves to semantic)
- `styles/themes/definitions.ts` — remove `...baseVariables` spread, add `--border-strong` to each theme
- `package.json` — version bump to 0.6.0
- Every `*.module.scss` — wrap in `@layer doom.components`, migrate to semantic tokens
- Control components `.tsx` — add `size?: ControlSize` prop where missing

### Deleted files
- `styles/_tokens.scss` — replaced by `_primitives.scss` + `_semantic.scss`

---

### Task 1: Create `_primitives.scss`

**Files:**
- Create: `styles/_primitives.scss`
- Delete: `styles/_tokens.scss` (deferred to Task 2 — semantic needs to exist first)

- [ ] **Step 1: Create `styles/_primitives.scss`**

```scss
// =============================================================================
// DOOM DESIGN SYSTEM — PRIMITIVE TOKENS
// Base unit: 4px. Every value is derived from this.
// RULE: Only _semantic.scss may reference these tokens.
// =============================================================================

:root {
  // ---------------------------------------------------------------------------
  // SPACING — Intentionally gapped scale (no --space-5, --space-7, etc.)
  // ---------------------------------------------------------------------------
  --space-px: 1px;
  --space-0\.5: 2px;
  --space-1: 4px;
  --space-1\.5: 6px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  // ---------------------------------------------------------------------------
  // SIZES — Heights/widths of interactive elements
  // ---------------------------------------------------------------------------
  --size-4: 16px;
  --size-5: 20px;
  --size-6: 24px;
  --size-7: 28px;
  --size-8: 32px;
  --size-10: 40px;
  --size-11: 44px;
  --size-12: 48px;

  // ---------------------------------------------------------------------------
  // TYPE SCALE — 1.25 major-third ratio anchored at 14px
  // ---------------------------------------------------------------------------
  --text-2xs: 0.625rem;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;

  // ---------------------------------------------------------------------------
  // FONT WEIGHTS
  // ---------------------------------------------------------------------------
  --font-thin: 100;
  --font-extralight: 200;
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;

  // ---------------------------------------------------------------------------
  // SHADOW OFFSETS — Hard only, derived from spacing
  // Color is applied by semantic layer (var(--shadow-base), var(--shadow-primary), etc.)
  // ---------------------------------------------------------------------------
  --shadow-offset-sm: var(--space-0\.5) var(--space-0\.5) 0 0;
  --shadow-offset-md: var(--space-1) var(--space-1) 0 0;
  --shadow-offset-lg: var(--space-1\.5) var(--space-1\.5) 0 0;
  --shadow-offset-xl: var(--space-2) var(--space-2) 0 0;

  // ---------------------------------------------------------------------------
  // RADIUS
  // ---------------------------------------------------------------------------
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-pill: 9999px;
  --radius-full: 50%;

  // ---------------------------------------------------------------------------
  // MOTION
  // ---------------------------------------------------------------------------
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  // ---------------------------------------------------------------------------
  // Z-INDEX
  // ---------------------------------------------------------------------------
  --z-base: 0;
  --z-elevated: 10;
  --z-header: 40;
  --z-dropdown: 50;
  --z-modal: 100;
  --z-overlay: 150;
  --z-drawer: 200;
  --z-tooltip: 500;

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------
  --blur-standard: 4px;
  --overlay-opacity: 0.5;
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx sass styles/_primitives.scss --no-source-map /dev/null 2>&1 || echo "SCSS error"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add styles/_primitives.scss
git commit -m "feat(tokens): create _primitives.scss with harmonic scale"
```

---

### Task 2: Create `_semantic.scss` and delete `_tokens.scss`

**Files:**
- Create: `styles/_semantic.scss`
- Delete: `styles/_tokens.scss`
- Modify: `styles/palettes.ts` — remove `baseVariables`
- Modify: `styles/themes/definitions.ts` — inline `--border-strong` per theme, remove spread

- [ ] **Step 1: Create `styles/_semantic.scss`**

```scss
// =============================================================================
// DOOM DESIGN SYSTEM — SEMANTIC TOKENS
// Purpose-named tokens that point to primitives.
// RULE: Components and mixins reference ONLY these tokens.
// =============================================================================

@use "primitives";

:root {
  // ---------------------------------------------------------------------------
  // CONTROL TOKENS — Form controls: Input, Select, Button, Combobox, etc.
  // Default tier is "md". Size variants override these locally via CSS classes.
  // ---------------------------------------------------------------------------
  --control-height: var(--size-8);
  --control-padding-x: var(--space-3);
  --control-padding-y: var(--space-1\.5);
  --control-font-size: var(--text-sm);
  --control-icon-size: var(--size-4);
  --control-gap: var(--space-1\.5);
  --control-radius: var(--radius-md);

  // ---------------------------------------------------------------------------
  // SURFACE TOKENS — Card, Modal, Drawer, Sheet, Page
  // ---------------------------------------------------------------------------
  --surface-padding: var(--space-4);
  --surface-padding-dense: var(--space-3);
  --surface-radius: var(--radius-md);
  --surface-gap: var(--space-4);
  --surface-border-width: 2px;

  // ---------------------------------------------------------------------------
  // SHADOW TOKENS — Semantic names for shadow usage
  // Shadow color comes from theme (--shadow-base, --shadow-primary, --shadow-error)
  // ---------------------------------------------------------------------------
  --shadow-sm: var(--shadow-offset-sm) var(--shadow-base);
  --shadow-md: var(--shadow-offset-md) var(--shadow-base);
  --shadow-lg: var(--shadow-offset-lg) var(--shadow-base);
  --shadow-xl: var(--shadow-offset-xl) var(--shadow-base);
  --shadow-sm-border: var(--shadow-offset-sm) var(--card-border);
  --shadow-md-border: var(--shadow-offset-md) var(--card-border);

  // ---------------------------------------------------------------------------
  // FEEDBACK TOKENS — Checkbox, Radio, Switch, Slider
  // ---------------------------------------------------------------------------
  --toggle-size: var(--size-5);
  --toggle-size-sm: var(--size-4);
  --switch-width: var(--space-8);
  --switch-height: var(--size-5);

  // ---------------------------------------------------------------------------
  // DISPLAY TOKENS — Chip, Badge (decorative, not controls)
  // ---------------------------------------------------------------------------
  --badge-padding-x: var(--space-1\.5);
  --badge-padding-y: var(--space-0\.5);
  --badge-font-size: var(--text-2xs);
  --chip-padding-x: var(--space-2);
  --chip-padding-y: var(--space-1);
  --chip-font-size: var(--text-xs);

  // ---------------------------------------------------------------------------
  // LAYOUT TOKENS — Widths, heights for structural elements
  // ---------------------------------------------------------------------------
  --width-sidebar: 280px;
  --width-sidebar-collapsed: 64px;
  --width-panel: 400px;
  --width-panel-wide: 600px;
  --width-modal-sm: 400px;
  --width-modal-md: 600px;
  --width-modal-lg: 800px;
  --width-modal-xl: 1024px;
  --width-prose: 65ch;
  --width-prose-narrow: 45ch;
  --width-prose-wide: 80ch;
  --header-height: 56px;
  --header-height-sm: 48px;
  --page-max-width: 1920px;
  --drawer-width: var(--width-panel);

  // ---------------------------------------------------------------------------
  // TYPOGRAPHY STANDARDS
  // ---------------------------------------------------------------------------
  --font-heading: var(--font-montserrat);
  --heading-transform: uppercase;
  --heading-weight: 800;
}
```

- [ ] **Step 2: Remove `baseVariables` from `styles/palettes.ts`**

Remove the `baseVariables` export at the bottom of the file (lines 143-149). Keep the `palette` export unchanged.

Before:
```ts
export const baseVariables = {
  // Common Colors (still needed for JS theme injection)
  "--common-black": palette.black[950],
  "--common-white": palette.white[950],
  "--border-strong": palette.black[950],
};
```

After: delete the entire `baseVariables` block and its export.

- [ ] **Step 3: Update `styles/themes/definitions.ts`**

Remove the `baseVariables` import and the `...baseVariables` spread in each theme. Each theme already defines `--border-strong` in its variables block, so the spread was redundant except for `--common-black` and `--common-white` — these are unused by any component (search confirms 0 references). Remove them.

Change the import line from:
```ts
import { baseVariables, palette } from "../palettes";
```
To:
```ts
import { palette } from "../palettes";
```

In each theme's `variables` block, remove `...baseVariables,` (first line inside `variables`).

- [ ] **Step 4: Delete `styles/_tokens.scss`**

```bash
git rm styles/_tokens.scss
```

- [ ] **Step 5: Run build to verify**

Run: `npm run build 2>&1 | tail -10`
Expected: Build will fail because components still reference old tokens. That's expected — subsequent tasks will migrate them. Verify the new files have no SCSS syntax errors by checking the error is about missing old token references, not about `_primitives.scss` or `_semantic.scss`.

- [ ] **Step 6: Commit**

```bash
git add styles/_semantic.scss styles/_primitives.scss styles/palettes.ts styles/themes/definitions.ts
git rm styles/_tokens.scss
git commit -m "feat(tokens): add semantic layer, remove _tokens.scss and baseVariables"
```

---

### Task 3: Rewrite `_mixins.scss`

**Files:**
- Modify: `styles/_mixins.scss`

- [ ] **Step 1: Rewrite `styles/_mixins.scss`**

Replace the entire file with:

```scss
@use "sass:map";

// =============================================================================
// DOOM DESIGN SYSTEM — MIXINS
// RULE: Mixins reference ONLY semantic tokens. Never primitives.
// =============================================================================

// ---------------------------------------------------------------------------
// CONTROL MIXINS — For interactive elements (Button, Input, Select, etc.)
// ---------------------------------------------------------------------------

/// Base styles for every interactive control.
/// Reads: --control-height, --control-padding-y, --control-padding-x,
///         --control-font-size, --control-radius, --surface-border-width
@mixin control {
  height: var(--control-height);
  padding: var(--control-padding-y) var(--control-padding-x);
  font-size: var(--control-font-size);
  border: var(--surface-border-width) solid var(--card-border);
  border-radius: var(--control-radius);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-fast) var(--ease-in-out);
  outline: none;
}

/// Hover lift with shadow grow.
@mixin hover {
  &:hover {
    transform: translate(calc(-1 * var(--space-0\.5)), calc(-1 * var(--space-0\.5)));
    box-shadow: var(--shadow-lg);
  }
}

/// Keyboard focus ring.
@mixin focus {
  &:focus-visible,
  &[aria-expanded="true"] {
    outline: none;
    transform: translate(calc(-1 * var(--space-0\.5)), calc(-1 * var(--space-0\.5)));
    box-shadow: var(--shadow-offset-xl) var(--shadow-primary);
    border-color: var(--primary);
  }
  &:focus {
    outline: none;
  }
}

/// Active press state.
@mixin press {
  &:active {
    transition: none;
    transform: translate(var(--space-0\.5), var(--space-0\.5));
    box-shadow: none;
  }
}

/// Error state border and shadow.
@mixin error {
  border-color: var(--error);
  box-shadow: var(--shadow-offset-lg) var(--shadow-error);

  &:focus,
  &:focus-visible {
    border-color: var(--error);
    box-shadow: var(--shadow-offset-xl) var(--shadow-error);
  }
}

/// Disabled state with hatched overlay.
@mixin disabled-state {
  opacity: 0.6;
  cursor: not-allowed !important;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0, 0, 0, 0.05) 10px,
    rgba(0, 0, 0, 0.05) 20px
  ) !important;

  &:hover {
    transform: none !important;
    filter: none !important;
  }
}

// ---------------------------------------------------------------------------
// SURFACE MIXIN — For containers (Card, Modal, Drawer, Sheet, Page)
// ---------------------------------------------------------------------------

@mixin surface {
  padding: var(--surface-padding);
  border: var(--surface-border-width) solid var(--card-border);
  border-radius: var(--surface-radius);
  background: var(--card-bg);
  box-shadow: var(--shadow-md);
}

// ---------------------------------------------------------------------------
// THEME MIXINS
// ---------------------------------------------------------------------------

/// Inverts theme for content on primary-colored backgrounds.
@mixin invert-theme {
  --primary: var(--primary-foreground);
  --primary-foreground: var(--primary);
  --foreground: var(--primary-foreground);
  --muted-foreground: var(--primary-foreground);
}

/// Applies solid variant styling using subtheme tokens.
@mixin solid-variant {
  background-color: var(--solid-bg);
  color: var(--solid-fg);
  --background: var(--solid-bg);
  --foreground: var(--solid-fg);
  --muted-foreground: color-mix(in srgb, var(--solid-fg) 70%, transparent);
  --surface-brand: var(--solid-bg);
  --surface-brand-foreground: var(--solid-fg);
  --success: var(--solid-success);
  --success-foreground: var(--solid-fg);
  --error: var(--solid-error);
  --error-foreground: var(--solid-fg);
  --warning: var(--solid-warning);
  --warning-foreground: var(--solid-fg);
  --on-surface: var(--solid-bg);
  --on-surface-muted: var(--solid-bg);
  --card-bg: color-mix(in srgb, var(--solid-fg) 95%, var(--solid-bg) 5%);
  --card-border: var(--solid-fg);
  --card-foreground: var(--solid-fg);
  --popover: color-mix(in srgb, var(--solid-fg) 95%, var(--solid-bg) 5%);
  --popover-foreground: var(--solid-bg);
  --input: color-mix(in srgb, var(--solid-fg) 95%, var(--solid-bg) 5%);
  --border-strong: var(--solid-fg);
  --primary: var(--solid-fg);
  --primary-foreground: var(--solid-bg);
  --secondary: color-mix(in srgb, var(--solid-bg) 90%, transparent);
  --secondary-foreground: var(--solid-fg);
  --muted: color-mix(in srgb, var(--solid-fg) 20%, transparent);
}

// ---------------------------------------------------------------------------
// SHADOW MIXIN
// ---------------------------------------------------------------------------

/// Directional hard shadow using shadow scale tokens.
@mixin shadow-directional(
  $direction: "standard",
  $size: var(--space-2),
  $color: var(--shadow-base)
) {
  @if $direction == "standard" {
    box-shadow: #{$size} #{$size} 0 0 $color;
  } @else if $direction == "top" {
    box-shadow: #{$size} calc(-1 * #{$size}) 0 0 $color;
  } @else if $direction == "bottom" {
    box-shadow: #{$size} #{$size} 0 0 $color;
  } @else if $direction == "left" {
    box-shadow: calc(-1 * #{$size}) #{$size} 0 0 $color;
  } @else if $direction == "right" {
    box-shadow: #{$size} #{$size} 0 0 $color;
  }
}

// ---------------------------------------------------------------------------
// RESPONSIVE
// ---------------------------------------------------------------------------

$breakpoints: (
  "xxs": 360px,
  "xs": 480px,
  "sm": 640px,
  "md": 768px,
  "lg": 1024px,
  "xl": 1280px,
);

@mixin mq($breakpoint, $type: "min") {
  $width: $breakpoint;
  @if map.has-key($breakpoints, $breakpoint) {
    $width: map.get($breakpoints, $breakpoint);
  }

  @media (#{$type}-width: $width) {
    @content;
  }
}

// ---------------------------------------------------------------------------
// CONTROL SIZE OVERRIDES — Apply as class to override semantic control vars
// ---------------------------------------------------------------------------

@mixin control-sm {
  --control-height: var(--size-7);
  --control-padding-x: var(--space-2);
  --control-padding-y: var(--space-1);
  --control-font-size: var(--text-xs);
  --control-icon-size: var(--size-4);
  --control-gap: var(--space-1);
  --control-radius: var(--radius-sm);
}

@mixin control-lg {
  --control-height: var(--size-10);
  --control-padding-x: var(--space-4);
  --control-padding-y: var(--space-2);
  --control-font-size: var(--text-base);
  --control-icon-size: var(--size-5);
  --control-gap: var(--space-2);
  --control-radius: var(--radius-md);
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/_mixins.scss
git commit -m "feat(mixins): rewrite mixins to use semantic tokens only"
```

---

### Task 4: CSS layer setup, globals, reset, and shared types

**Files:**
- Modify: `styles/globals.scss`
- Modify: `styles/_reset.scss`
- Create: `styles/types.ts`

- [ ] **Step 1: Update `styles/globals.scss`**

```scss
// Layer order declaration — consumer (unlayered) CSS always wins
@layer doom.reset, doom.utilities, doom.components;

@use "primitives";
@use "semantic";
@use "reset";
@use "utilities";
```

- [ ] **Step 2: Update `styles/_reset.scss`**

```scss
@layer doom.reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    height: 100%;
  }

  body {
    font-size: var(--text-sm);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans, system-ui, sans-serif);
  }

  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
  }

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }
}
```

Key change: `font-size: var(--text-sm)` (14px) on body. Wrapped in `@layer doom.reset`.

- [ ] **Step 3: Create `styles/types.ts`**

```ts
export type ControlSize = "sm" | "md" | "lg";
export const DEFAULT_CONTROL_SIZE: ControlSize = "md";
```

- [ ] **Step 4: Commit**

```bash
git add styles/globals.scss styles/_reset.scss styles/types.ts
git commit -m "feat: CSS layer setup, 14px default body font, shared ControlSize type"
```

---

### Task 5: Rewrite `_utilities.scss`

**Files:**
- Modify: `styles/_utilities.scss`

- [ ] **Step 1: Rewrite `styles/_utilities.scss`**

Wrap the entire file in `@layer doom.utilities { ... }`. Replace all hardcoded values and old token references with the new primitive scale. The utility class names stay the same (`.gap-4`, `.p-3`, etc.) but now read from `--space-*` tokens.

Key changes:
- All spacing utilities (gap, margin, padding) use `var(--space-N)` lookup instead of computed `$i * 0.25rem`
- Typography size classes use `var(--text-*)` tokens
- Font weight classes use `var(--font-*)` tokens
- Heading base styles use `var(--text-*)` scale
- Shadow utilities use `var(--shadow-md)` etc.
- Responsive prefixes remain unchanged in logic but values reference tokens
- Wrap everything in `@layer doom.utilities`

The utility scale for spacing classes (`.gap-0` through `.gap-10`) should map as:
```
0 → 0
1 → var(--space-1)    // 4px
2 → var(--space-2)    // 8px
3 → var(--space-3)    // 12px
4 → var(--space-4)    // 16px
5 → var(--space-4)    // 16px (no space-5, alias to 4)
6 → var(--space-6)    // 24px
7 → var(--space-6)    // 24px (no space-7, alias to 6)
8 → var(--space-8)    // 32px
9 → var(--space-8)    // 32px (no space-9, alias to 8)
10 → var(--space-8)   // 32px (cap at 8)
```

Heading sizes:
```
h1 → var(--text-5xl)
h2 → var(--text-4xl)
h3 → var(--text-3xl)
h4 → var(--text-2xl)
h5 → var(--text-xl)
h6 → var(--text-lg)
```

- [ ] **Step 2: Commit**

```bash
git add styles/_utilities.scss
git commit -m "feat(utilities): rewrite utilities with token scale, wrap in CSS layer"
```

---

### Task 6: Migrate control components — Button, Input

**Files:**
- Modify: `components/Button/Button.module.scss`
- Modify: `components/Button/Button.tsx`
- Modify: `components/Input/Input.module.scss`
- Modify: `components/Input/Input.tsx`

This task establishes the reference pattern for all control component migrations.

- [ ] **Step 1: Rewrite `Button.module.scss`**

Wrap in `@layer doom.components`. Replace all old tokens with semantic tokens. Use `@include control`, `@include hover`, `@include focus`, `@include press`, `@include disabled-state`. Size classes use `@include control-sm` and `@include control-lg`.

Key mapping:
- Remove explicit `height`, `padding`, `font-size`, `border`, `border-radius`, `box-shadow`, `transition` — these come from `@include control`
- `.sm` class: `@include control-sm` (was `--control-height-sm` / 32px, now `--size-7` / 28px)
- `.md` class: no override needed (default)
- `.lg` class: `@include control-lg` (was `--control-height-lg` / 48px, now `--size-10` / 40px)
- Replace `var(--spacing-*)` with `var(--space-*)` equivalents
- Replace `var(--shadow-hard)` with `var(--shadow-md)`
- Replace `var(--radius)` with `var(--control-radius)`
- Replace `var(--border-width)` with `var(--surface-border-width)`
- Variant color overrides (primary, secondary, ghost, etc.) remain unchanged — they're theme tokens

- [ ] **Step 2: Update `Button.tsx` imports**

Add import of `ControlSize`:
```tsx
import type { ControlSize } from "../../styles/types";
```

Change the `size` prop type from `"sm" | "md" | "lg"` to `ControlSize`. Default remains `"md"`.

- [ ] **Step 3: Rewrite `Input.module.scss`**

Wrap in `@layer doom.components`. Replace `@include base-interactive` with `@include control`. Add `@include focus` and `@include error`.

Key mapping:
- Remove hardcoded `height: var(--control-height-lg)` — now comes from `@include control` (32px default)
- Replace `var(--spacing-*)` with `var(--space-*)` equivalents
- Replace `var(--text-base)` with `var(--control-font-size)` for the input itself
- Add `.sm` and `.lg` classes with `@include control-sm` / `@include control-lg`
- Label, helper text, error text sizing: use `var(--text-xs)` / `var(--text-sm)` from primitives

- [ ] **Step 4: Update `Input.tsx`**

Add `size?: ControlSize` prop (default `"md"`). Import `ControlSize` from `../../styles/types`. Apply size class via `clsx(styles.root, size !== "md" && styles[size])`.

- [ ] **Step 5: Run tests**

Run: `npm test -- components/Button components/Input --run`
Expected: All existing tests pass (visual changes don't break functionality tests)

- [ ] **Step 6: Commit**

```bash
git add components/Button/ components/Input/ styles/types.ts
git commit -m "feat: migrate Button and Input to harmonic token system"
```

---

### Task 7: Migrate control components — Select, Combobox

**Files:**
- Modify: `components/Select/Select.module.scss`, `components/Select/Select.tsx`
- Modify: `components/Combobox/Combobox.module.scss`, `components/Combobox/Combobox.tsx`

- [ ] **Step 1: Rewrite `Select.module.scss`**

Same pattern as Button/Input: wrap in `@layer doom.components`, use `@include control`, `@include hover`, `@include focus`. Replace old tokens.

Key mapping:
- Current `.sm` (40px) → new `.sm` (28px via `@include control-sm`)
- Current default (48px) → new default (32px via `@include control`)
- Add `.lg` class: `@include control-lg` (40px)
- Dropdown menu items: use `var(--control-padding-y)` and `var(--control-padding-x)` for consistent item sizing

- [ ] **Step 2: Update `Select.tsx`**

Change `size` prop type from `"sm" | "md"` to `ControlSize`. Import from `../../styles/types`. Default stays `"md"`. Add `"lg"` option.

- [ ] **Step 3: Rewrite `Combobox.module.scss`**

Same pattern as Select. Trigger button uses `@include control`. Size classes use `@include control-sm` / `@include control-lg`.

- [ ] **Step 4: Update `Combobox.tsx`**

Change `size` prop from `"sm" | "md"` to `ControlSize`. Add `"lg"` support.

- [ ] **Step 5: Run tests**

Run: `npm test -- components/Select components/Combobox --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/Select/ components/Combobox/
git commit -m "feat: migrate Select and Combobox to harmonic token system"
```

---

### Task 8: Migrate control components — Textarea, Dropdown, SplitButton

**Files:**
- Modify: `components/Textarea/Textarea.module.scss`, `components/Textarea/Textarea.tsx`
- Modify: `components/Dropdown/Dropdown.module.scss`, `components/Dropdown/Dropdown.tsx`
- Modify: `components/SplitButton/SplitButton.module.scss`, `components/SplitButton/SplitButton.tsx`

- [ ] **Step 1: Rewrite `Textarea.module.scss`**

Wrap in `@layer doom.components`. Use semantic tokens for padding and font-size but NOT `@include control` (Textarea doesn't have a fixed height). Use `var(--control-padding-x)`, `var(--control-padding-y)`, `var(--control-font-size)`, `var(--control-radius)`. Add `.sm` / `.lg` overrides.

- [ ] **Step 2: Update `Textarea.tsx`**

Add `size?: ControlSize` prop. Import from `../../styles/types`. Apply class.

- [ ] **Step 3: Rewrite `Dropdown.module.scss`**

Wrap in `@layer doom.components`. Trigger button uses `@include control`. Menu items use `var(--control-padding-y) var(--control-padding-x)` and `var(--control-font-size)`.

- [ ] **Step 4: Update `Dropdown.tsx`**

Add `size?: ControlSize` prop. Apply class to trigger.

- [ ] **Step 5: Rewrite `SplitButton.module.scss`**

Wrap in `@layer doom.components`. Both the main button and dropdown trigger use `@include control`. Replace `var(--control-height-md)` with `var(--control-height)`.

- [ ] **Step 6: Update `SplitButton.tsx`**

Add `size?: ControlSize` prop. Apply to both button parts.

- [ ] **Step 7: Run tests**

Run: `npm test -- components/Textarea components/Dropdown components/SplitButton --run`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/Textarea/ components/Dropdown/ components/SplitButton/
git commit -m "feat: migrate Textarea, Dropdown, SplitButton to harmonic token system"
```

---

### Task 9: Migrate surface components — Card, Modal, Drawer, Sheet, Page

**Files:**
- Modify: `components/Card/Card.module.scss`
- Modify: `components/Modal/Modal.module.scss`
- Modify: `components/Drawer/Drawer.module.scss`
- Modify: `components/Sheet/Sheet.module.scss`
- Modify: `components/Page/Page.module.scss`

- [ ] **Step 1: Rewrite each surface component SCSS**

For each: wrap in `@layer doom.components`. Use `@include surface` for the root container where appropriate. Replace old tokens:
- `var(--spacing-*)` → `var(--space-*)` equivalents
- `var(--radius)` → `var(--surface-radius)`
- `var(--border-width)` → `var(--surface-border-width)`
- `var(--shadow-hard)` → `var(--shadow-md)`
- Card: `var(--spacing-6)` padding → `var(--surface-padding)`
- Modal/Drawer/Sheet: header/body/footer padding → `var(--surface-padding)`

No TypeScript changes — surface components don't get a size prop.

- [ ] **Step 2: Run tests**

Run: `npm test -- components/Card components/Modal components/Drawer components/Sheet components/Page --run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/Card/ components/Modal/ components/Drawer/ components/Sheet/ components/Page/
git commit -m "feat: migrate surface components to harmonic token system"
```

---

### Task 10: Migrate feedback components — Checkbox, RadioGroup, Switch, Slider

**Files:**
- Modify: `components/Checkbox/Checkbox.module.scss`
- Modify: `components/RadioGroup/RadioGroup.module.scss`
- Modify: `components/Switch/Switch.module.scss`
- Modify: `components/Slider/Slider.module.scss`

- [ ] **Step 1: Rewrite each feedback component SCSS**

For each: wrap in `@layer doom.components`. Use feedback semantic tokens:
- Checkbox: box size → `var(--toggle-size)` (20px, down from 24px)
- RadioGroup: circle size → `var(--toggle-size)` (20px, down from 24px)
- Switch: track → `var(--switch-width)` × `var(--switch-height)` (32px × 20px)
- Slider: thumb → `var(--toggle-size)` (20px), track height → `var(--space-2)` (8px, down from 12px)
- Replace all `var(--spacing-*)` with `var(--space-*)` equivalents
- Replace `var(--radius)` → `var(--radius-md)`, `var(--radius-pill)` stays
- Replace `var(--border-width)` → `var(--surface-border-width)`

No TypeScript changes — these don't get size props.

- [ ] **Step 2: Run tests**

Run: `npm test -- components/Checkbox components/RadioGroup components/Switch components/Slider --run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/Checkbox/ components/RadioGroup/ components/Switch/ components/Slider/
git commit -m "feat: migrate feedback components to harmonic token system"
```

---

### Task 11: Migrate display components — Chip, Badge, Spinner

**Files:**
- Modify: `components/Chip/Chip.module.scss`
- Modify: `components/Badge/Badge.module.scss`
- Modify: `components/Spinner/Spinner.module.scss`

- [ ] **Step 1: Rewrite each display component SCSS**

Wrap in `@layer doom.components`. Use display semantic tokens:
- Chip: base size uses `var(--chip-padding-x)`, `var(--chip-padding-y)`, `var(--chip-font-size)`. Size variants (xs–xl) use primitive scale directly since Chip has its own 5-tier scale.
- Badge: uses `var(--badge-padding-x)`, `var(--badge-padding-y)`, `var(--badge-font-size)`. Size variants (sm–lg) reference primitives for their tier.
- Spinner: replace any hardcoded sizes with `var(--size-*)` tokens
- Replace all `var(--spacing-*)` with `var(--space-*)` equivalents

No TypeScript changes — Chip and Badge keep their existing size prop scales.

- [ ] **Step 2: Run tests**

Run: `npm test -- components/Chip components/Badge components/Spinner --run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/Chip/ components/Badge/ components/Spinner/
git commit -m "feat: migrate display components to harmonic token system"
```

---

### Task 12: Migrate remaining components (content-driven, structural)

**Files:**
- Modify SCSS for: Accordion, ActionRow, Alert, Avatar, Breadcrumbs, CopyButton, FileUpload, Form, Icon, Image, Label, Layout, Link, Pagination, Popover, Skeleton, Slat, Sidebar, Tabs, Table, Text, Textarea, Toast, Tooltip

- [ ] **Step 1: Wrap each component SCSS in `@layer doom.components`**

For every remaining `.module.scss` file not yet migrated:
1. Add `@layer doom.components { ... }` wrapper around all styles
2. Replace `var(--spacing-*)` → `var(--space-*)` equivalents throughout
3. Replace `var(--radius)` → `var(--radius-md)` (or `--radius-sm`/`--radius-lg` where contextually appropriate)
4. Replace `var(--border-width)` → `var(--surface-border-width)`
5. Replace `var(--shadow-hard)` → `var(--shadow-md)`, `var(--shadow-hover)` → `var(--shadow-lg)`, `var(--shadow-sm)` → `var(--shadow-sm)`, `var(--shadow-lg)` → `var(--shadow-xl)`
6. Replace `@include base-interactive` → `@include control` (where the component is interactive)
7. Replace `@include brutalist-hover` → `@include hover`
8. Replace `@include brutalist-shadow(...)` → `@include shadow-directional(...)`

Components with specific token references:
- **Pagination**: button height → `var(--control-height)` instead of `var(--spacing-10)`
- **Tabs**: trigger padding → `var(--control-padding-y) var(--control-padding-x)`
- **CopyButton**: inherits Button, just wrap in layer
- **Table**: already has `--control-height-*` references → update to new names. Wrap in layer.
- **FileUpload**: header height → `var(--header-height)`. Internal controls inherit new sizes. Wrap in layer.
- **Sidebar**: width tokens already semantic (`--width-sidebar`). Just update spacing tokens and wrap.

- [ ] **Step 2: Run full test suite**

Run: `npm test -- --run`
Expected: All 94+ test files pass

- [ ] **Step 3: Commit**

```bash
git add components/
git commit -m "feat: migrate all remaining components to harmonic tokens and CSS layers"
```

---

### Task 13: Version bump and final verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump version to 0.6.0**

In `package.json`, change:
```json
"version": "0.5.1",
```
To:
```json
"version": "0.6.0",
```

- [ ] **Step 2: Run full test suite**

Run: `npm test -- --run`
Expected: All tests pass

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 4: Visual smoke test**

Run: `npm run storybook`
Verify in browser:
- Button, Input, Select render at new default size (32px)
- Size variants (sm/lg) work on all control components
- Card, Modal, Drawer look correct with surface tokens
- Checkbox, Switch, Radio are smaller (20px)
- No broken layouts or missing styles

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 0.6.0 — sizing harmonics overhaul"
```

---

## Post-Implementation: Required Follow-Up (Hard Gate)

Before ANY other project proceeds:
- Update all 44 component skill docs
- Rewrite `styles.md`, `css-variables.md`, `utilities.md`
- Update `SKILL.md` token quick-ref
- Update theme-builder agent token reference
