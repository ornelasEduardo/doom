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
border: var(--border-width) solid var(--card-border);

// Wrong
border: 1px solid #ccc;
border: none;
```

### 2. Shadows

Hard offset shadows only. No blur.

```scss
// Correct
box-shadow: var(--shadow-hard);

// Wrong
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### 3. Hover States

Elements lift on hover. Shadow compensates.

```scss
// Correct
&:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hover);
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
padding: var(--spacing-4);  // 16px
gap: var(--spacing-6);      // 24px

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
  @include base-interactive; // border, shadow, transition
  background: var(--card-bg);

  @include brutalist-hover; // lift + shadow grow
  @include focus; // focus-visible ring
}
```

## Design Tokens

Source: `styles/_tokens.scss`

### Base Unit

All spatial tokens derive from `$base-unit: 0.25rem` (4px).

### Spacing Scale

Numeric scale where N = N * 4px.

```
--spacing-half: 2px     (design exception)
--spacing-1:   4px
--spacing-2:   8px
--spacing-3:   12px
--spacing-4:   16px
--spacing-5:   20px
--spacing-6:   24px
--spacing-8:   32px
--spacing-10:  40px
--spacing-12:  48px
--spacing-16:  64px
--spacing-20:  80px
--spacing-24:  96px
--spacing-32:  128px
--spacing-36:  144px
--spacing-40:  160px
--spacing-56:  224px
--spacing-64:  256px
--spacing-72:  288px
--spacing-100: 400px
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
--text-6xl: 3.75rem   (60px)
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
--border-width:   2px   (never change — neubrutalism requires it)
--radius:         4px
--radius-lg:      8px
--radius-xl:      16px
--radius-pill:    9999px
--radius-full:    50%
--outline-width:  2px
--outline-offset: 2px
```

### Shadows

```
--shadow-hard:             4px 4px 0 0 var(--shadow-base)       (buttons, cards)
--shadow-hover:            8px 8px 0 0 var(--shadow-base)       (hover state)
--shadow-sm:               4px 4px 0 0 var(--card-border)       (small elements)
--shadow-sm-hover:         8px 8px 0 0 var(--card-border)
--shadow-sm-checked:       4px 4px 0 0 var(--card-border)
--shadow-sm-checked-hover: 8px 8px 0 0 var(--card-border)
--shadow-lg:               8px 8px 0 0 var(--card-border)       (large elements)
```

### Control Heights

```
--control-height-sm: 32px
--control-height-md: 40px
--control-height-lg: 48px
```

### Sizing & Widths

```
--width-full:    100%
--width-screen:  100vw
--height-screen: 100vh
--width-min:     min-content
--width-max:     max-content
--width-fit:     fit-content
```

#### Prose (reading widths)
```
--width-prose-narrow: 45ch   (captions, side notes)
--width-prose:        65ch   (standard reading)
--width-prose-wide:   80ch   (docs, technical writing)
```

#### Layout
```
--width-sidebar:           280px
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

#### Controls
```
--width-control-sm: 120px
--width-control-md: 240px
--width-control-lg: 320px
--width-control-xl: 400px
```

#### Form
```
--form-col-min:      128px
--form-select-width: 144px
```

### Icon Sizes

```
--size-icon-sm:     20px
--size-icon-md:     24px
--size-icon-lg:     32px
--size-touch-target: 44px
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

### `base-interactive`

Base styles for clickable elements: border, border-radius, shadow, transition.

```scss
.myButton {
  @include base-interactive;
}
```

### `focus`

Focus-visible ring with lift and primary shadow. Also handles `aria-expanded`.

```scss
.myInput {
  @include focus;
}
```

### `error`

Error state: red border + error shadow.

```scss
.myInput {
  &.hasError {
    @include error;
  }
}
```

### `brutalist-hover($lift: 2px, $shadow-color: var(--shadow-base))`

Hover lift effect. Shadow grows to compensate for lift.

```scss
.myCard {
  @include brutalist-hover(2px, var(--shadow-base));
}
```

### Active/press state (raw CSS, no mixin)

```scss
&:active {
  transition: none;
  transform: translate(var(--spacing-half), var(--spacing-half));
  box-shadow: none;
}
```

### `disabled-state`

Disabled styling with hatched pattern overlay. Kills hover effects.

```scss
.myButton:disabled {
  @include disabled-state;
}
```

### `invert-theme`

Inverts theme for content on primary-colored backgrounds. Swaps `--primary` and `--primary-foreground`.

### `solid-variant`

Applies full solid variant styling. Overrides all color, surface, button, input, and popover tokens for a solid-background context. Used by Modal, Sheet, Drawer with `variant="solid"`.

### `brutalist-shadow($direction: "standard", $size: 8px, $color: var(--shadow-base))`

Directional hard shadows.

```scss
.myElement {
  @include brutalist-shadow("left", 8px, var(--shadow-base));
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
