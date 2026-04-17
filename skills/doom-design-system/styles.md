# Doom Styles Reference

## Aesthetic Principles

- **Bold borders** — 2px solid, always
- **Hard shadows** — No blur, offset only
- **High contrast** — Meets WCAG AAA
- **Geometric** — 4px border-radius, clean lines

### 1. Borders

Every interactive element has a 2px solid border.

```scss
// Correct
border: var(--surface-border-width) solid var(--card-border);

// Wrong
border: 1px solid #ccc;
border: none;
```

### 2. Shadows

Hard offset shadows only. No blur.

```scss
// Correct
box-shadow: var(--shadow-md);

// Wrong
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### 3. Hover States

Elements lift on hover. Shadow compensates.

```scss
// Correct — use the hover mixin
@include hover;

// Or manually:
&:hover {
  transform: translate(calc(-1 * var(--space-0\.5)), calc(-1 * var(--space-0\.5)));
  box-shadow: var(--shadow-lg);
}

// Wrong
&:hover {
  opacity: 0.8;
}
```

### 4. Colors

Use CSS variables. Never hardcode hex values.

```tsx
// Correct
style={{ background: "var(--card-bg)" }}

// Wrong
style={{ background: "#ffffff" }}
```

### 5. Typography

Headings are bold and uppercase.

```scss
font-family: var(--font-heading);
font-weight: var(--heading-weight); // 800
text-transform: var(--heading-transform); // uppercase
```

### Color Usage

| Purpose         | Variable    |
| --------------- | ----------- |
| Primary actions | `--primary` |
| Success         | `--success` |
| Errors          | `--error`   |
| Warnings        | `--warning` |
| Muted text      | `--muted-foreground` |

Use color sparingly. Most UI should be black/white/gray with one accent.

### Spacing

Use the numeric spacing scale (base unit = 4px):

```tsx
// Correct — use token variables
padding: var(--space-4);  // 16px
gap: var(--space-6);      // 24px

// Correct — component gap prop
<Stack gap={4}>...</Stack>

// Wrong
<div style={{ marginBottom: "16px" }}>...</div>
```

### Animation

Keep it fast: 150-250ms. Use `transform` for motion.

```scss
transition: all var(--duration-fast) var(--ease-in-out);
```

### Avoid

- Rounded pills (except badges/chips)
- Gradients
- Soft shadows
- Thin fonts (< 400 weight)
- Icon-only buttons without labels
- Custom styles that bypass tokens

### Component Template

```scss
@use "../../styles/mixins" as *;

.component {
  @include control; // height, padding, border, shadow, transition
  @include hover;   // lift + shadow grow
  @include focus;   // focus-visible ring
  @include press;   // active press state

  background: var(--card-bg);
  color: var(--foreground);

  &:disabled {
    @include disabled-state;
  }
}
```

## Design Tokens

Source: `styles/_primitives.scss` (primitives), `styles/_semantic.scss` (semantic tokens)

### Base Unit

All spatial tokens derive from a 4px base unit.

### Spacing Scale

Intentionally gapped scale (no --space-5, --space-7, etc.):

```
--space-px:   1px
--space-0.5:  2px
--space-1:    4px
--space-1.5:  6px
--space-2:    8px
--space-3:    12px
--space-4:    16px
--space-6:    24px
--space-8:    32px
--space-12:   48px
--space-16:   64px
```

### Typography Scale

```
--text-2xs: 0.625rem  (10px)
--text-xs:  0.75rem   (12px)
--text-sm:  0.875rem  (14px)
--text-base: 1rem     (16px)
--text-lg:  1.125rem  (18px)
--text-xl:  1.25rem   (20px)
--text-2xl: 1.5rem    (24px)
--text-3xl: 1.875rem  (30px)
--text-4xl: 2.25rem   (36px)
--text-5xl: 3rem      (48px)
```

### Font Weights

```
--font-thin: 100
--font-extralight: 200
--font-light: 300
--font-regular: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
--font-black: 900
```

### Structural

```
--surface-border-width: 2px   (never change — neubrutalism requires it)
--radius-sm:    2px
--radius-md:    4px
--radius-lg:    8px
--radius-pill:  9999px
--radius-full:  50%
```

### Shadow Offsets (primitives)

```
--shadow-offset-sm: var(--space-0.5) var(--space-0.5) 0 0    (2px 2px)
--shadow-offset-md: var(--space-1) var(--space-1) 0 0        (4px 4px)
--shadow-offset-lg: var(--space-1.5) var(--space-1.5) 0 0    (6px 6px)
--shadow-offset-xl: var(--space-2) var(--space-2) 0 0        (8px 8px)
```

### Shadows (semantic)

```
--shadow-sm:        var(--shadow-offset-sm) var(--shadow-base)   (small elements)
--shadow-md:        var(--shadow-offset-md) var(--shadow-base)   (buttons, cards — default)
--shadow-lg:        var(--shadow-offset-lg) var(--shadow-base)   (hover state)
--shadow-xl:        var(--shadow-offset-xl) var(--shadow-base)   (focus state)
--shadow-sm-border: var(--shadow-offset-sm) var(--card-border)
--shadow-md-border: var(--shadow-offset-md) var(--card-border)
```

### Control Tokens (semantic)

Default tier is "md". Size variants use `@include control-sm` / `@include control-lg` mixins to override locally.

```
--control-height:    var(--size-8)     (40px, default md)
--control-padding-x: var(--space-3)
--control-padding-y: var(--space-1.5)
--control-font-size: var(--text-sm)
--control-icon-size: var(--size-5)
--control-gap:       var(--space-1.5)
--control-radius:    var(--radius-md)
```

### Surface Tokens (semantic)

```
--surface-padding:       var(--space-4)
--surface-padding-dense: var(--space-3)
--surface-radius:        var(--radius-md)
--surface-gap:           var(--space-4)
--surface-border-width:  2px
```

### Sizes (primitives)

```
--size-4:  16px
--size-5:  20px
--size-6:  24px
--size-7:  32px
--size-8:  40px
--size-9:  44px
--size-10: 48px
--size-11: 52px
--size-12: 56px
```

#### Prose (reading widths)
```
--width-prose-narrow: 45ch   (captions, side notes)
--width-prose:        65ch   (standard reading)
--width-prose-wide:   80ch   (docs, technical writing)
```

#### Layout
```
--width-sidebar:           240px
--width-sidebar-collapsed: 64px
--width-panel:             400px   (drawers, panels)
--width-panel-wide:        600px
--header-height:           56px
--header-height-sm:        48px
--page-max-width:          1920px
--drawer-width:            var(--width-panel)
```

#### Modals
```
--width-modal-sm: 400px
--width-modal-md: 600px
--width-modal-lg: 800px
--width-modal-xl: 1024px
```

### Feedback Tokens (semantic)

```
--toggle-size:    var(--size-5)    (20px)
--toggle-size-sm: var(--size-4)    (16px)
--switch-width:   var(--size-9)    (44px)
--switch-height:  var(--size-6)    (24px)
```

### Display Tokens (semantic)

```
--badge-padding-x:  var(--space-1.5)
--badge-padding-y:  var(--space-0.5)
--badge-font-size:  var(--text-2xs)
--chip-padding-x:   var(--space-2)
--chip-padding-y:   var(--space-1)
--chip-font-size:   var(--text-xs)
```

### Z-Index

```
--z-base:     0
--z-elevated: 10
--z-header:   40
--z-dropdown: 50
--z-modal:    100
--z-overlay:  150
--z-drawer:   200
--z-tooltip:  500
```

### Motion

```
--duration-fast:   150ms
--duration-normal: 250ms
--duration-slow:   350ms
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out:    cubic-bezier(0, 0, 0.2, 1)
--ease-in:     cubic-bezier(0.4, 0, 1, 1)
```

### Effects

```
--blur-standard:   4px
--overlay-opacity: 0.5
```

### Typography Standards

```
--font-heading:       var(--font-montserrat)
--heading-transform:  uppercase
--heading-weight:     800
```

## Palette

Source: `styles/palettes.ts`

Colors available via `palette.{color}[{shade}]` (e.g., `palette.purple[500]`).

| Color  | Shades    | Notes                     |
| ------ | --------- | ------------------------- |
| black  | 50-950    | Opacity scales (rgba)     |
| white  | 50-950    | Opacity scales (rgba)     |
| slate  | 50-950    | Full range                |
| purple | 50-900    | Primary for default theme |
| navy   | 50-900    | —                         |
| blue   | 50-900    | Primary for captain theme |
| indigo | 50-900    | —                         |
| yellow | 50-900    | Primary for vigilante     |
| green  | 50-900    | Primary for doom theme    |
| red    | 50-900    | Error states              |
| gray   | 50-990    | Extended range (975, 990) |

## CSS Custom Properties (Theme-Dependent)

Source: `styles/themes/definitions.ts`

These variables change per theme. Set via `DesignSystemProvider`.

### Color Variables

| Variable                 | Description               |
| ------------------------ | ------------------------- |
| `--primary`              | Brand/action color        |
| `--primary-foreground`   | Text on primary           |
| `--primary-hover`        | Hover state for primary   |
| `--secondary`            | Secondary actions         |
| `--secondary-foreground` | Text on secondary         |
| `--background`           | Page background           |
| `--foreground`           | Default text color        |
| `--card-bg`              | Card/component background |
| `--card-border`          | Card border color         |
| `--border-strong`        | Strong/emphasized borders |
| `--muted`                | Muted/disabled elements   |
| `--muted-foreground`     | Muted text                |
| `--success`              | Success state             |
| `--success-foreground`   | Text on success           |
| `--error`                | Error state               |
| `--error-foreground`     | Text on error             |
| `--warning`              | Warning state             |
| `--warning-foreground`   | Text on warning           |
| `--accent`               | Accent color              |

### Surface Variables

| Variable                     | Description             |
| ---------------------------- | ----------------------- |
| `--surface-brand`            | Branded surface bg      |
| `--surface-brand-foreground` | Text on branded surface |
| `--surface-accent`           | Accent surface bg       |
| `--on-surface`               | Text on any surface     |
| `--on-surface-muted`         | Muted text on surface   |

### Shadow Variables (Theme-Dependent)

| Variable           | Description                 |
| ------------------ | --------------------------- |
| `--shadow-base`    | Base shadow color           |
| `--shadow-primary` | Shadow for primary elements |
| `--shadow-error`   | Shadow for error states     |

### Solid Variant Tokens

Source: `styles/themes/solid-tokens.ts`

Used by `variant="solid"` on Modal, Sheet, Drawer, etc. Generated via `createSolidTokens(bg, fg, semantics)`.

| Variable           | Description                |
| ------------------ | -------------------------- |
| `--solid-bg`       | Solid variant background   |
| `--solid-fg`       | Solid variant text         |
| `--solid-success`  | Success on solid bg        |
| `--solid-error`    | Error on solid bg          |
| `--solid-warning`  | Warning on solid bg        |

### Theme Values

| Theme       | `--primary`   | `--background`  | `--shadow-base` | Mode  |
| ----------- | ------------- | --------------- | --------------- | ----- |
| `default`   | Purple 500    | Indigo 100      | Black 950       | Light |
| `doom`      | Green 600     | Slate 950       | Black 950       | Dark  |
| `captain`   | Blue 500      | Slate 50        | Black 950       | Light |
| `vigilante` | Yellow 600    | Gray 950        | Black 950       | Dark  |

Each theme defines all color variables, surface variables, shadow variables, and solid tokens. See `styles/themes/definitions.ts` for exact values.

## SCSS Mixins

Source: `styles/_mixins.scss`

Import with `@use "../../styles/mixins" as *;` (unqualified — dominant codebase convention).

### `control`

Base styles for every interactive control: height, padding, font-size, border, border-radius, shadow, transition.

```scss
.myButton {
  @include control;
}
```

### `hover`

Hover lift effect. Element lifts up and left, shadow grows to `--shadow-lg`.

```scss
.myButton {
  @include hover;
}
```

### `focus`

Keyboard focus ring with lift and primary shadow on `:focus-visible`. Also suppresses default outline on `:focus`.

```scss
.myInput {
  @include focus;
}
```

### `active-ring`

Active ring for open/expanded controls (same visual as focus). Targets `[aria-expanded="true"]`. Compose with `@include focus` for controls that need both.

```scss
.myDropdown {
  @include focus;
  @include active-ring;
}
```

### `press`

Active press state. Pushes element into the page (opposite of hover lift), removes shadow.

```scss
.myButton {
  @include press;
}
```

### `error`

Error state: red border + error shadow. Also overrides focus shadow to use error color.

```scss
.myInput {
  &.hasError {
    @include error;
  }
}
```

### `disabled-state`

Disabled styling with hatched pattern overlay. Kills hover effects.

```scss
.myButton:disabled {
  @include disabled-state;
}
```

### `surface`

Base styles for container elements (Card, Modal, Drawer, Sheet): padding, border, border-radius, background, shadow.

```scss
.myCard {
  @include surface;
}
```

### `control-sm` / `control-lg`

Size overrides for controls. Apply as a class modifier to override semantic control variables locally.

```scss
.sm { @include control-sm; }  // --size-7 (32px) height, smaller padding/font
.lg { @include control-lg; }  // --size-10 (48px) height, larger padding/font
```

### `invert-theme`

Inverts theme for content on primary-colored backgrounds. Swaps `--primary` and `--primary-foreground`.

### `solid-variant`

Applies full solid variant styling. Overrides all color, surface, button, input, and popover tokens for a solid-background context. Used by Modal, Sheet, Drawer with `variant="solid"`.

### `shadow-directional($direction: "standard", $size: var(--space-2), $color: var(--shadow-base))`

Directional hard shadows.

```scss
.myElement {
  @include shadow-directional("left", var(--space-2), var(--shadow-base));
}
```

Directions: `standard`, `top`, `bottom`, `left`, `right`

### `mq($breakpoint, $type: "min")`

Media query helper.

```scss
.myElement {
  @include mq("md") {
    flex-direction: row;
  }
}
```

Breakpoints: `xxs` (360px), `xs` (480px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
