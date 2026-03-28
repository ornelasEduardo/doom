# Doom Styles Reference

## Aesthetic Principles

- **Bold borders** — 2px solid, always
- **Hard shadows** — No blur, offset only
- **High contrast** — Meets WCAG AAA
- **Geometric** — 4px border-radius, clean lines

### 1. Borders

Every interactive element has a 2px solid border.

```scss
// ✅ Correct
border: var(--border-width) solid var(--card-border);

// ❌ Wrong
border: 1px solid #ccc;
border: none;
```

### 2. Shadows

Hard offset shadows only. No blur.

```scss
// ✅ Correct
box-shadow: var(--shadow-hard);

// ❌ Wrong
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### 3. Hover States

Elements lift on hover. Shadow compensates.

```scss
// ✅ Correct
&:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hover);
}

// ❌ Wrong
&:hover {
  opacity: 0.8;
}
```

### 4. Colors

Use CSS variables. Never hardcode hex values.

```tsx
// ✅ Correct
style={{ background: "var(--card-bg)" }}

// ❌ Wrong
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
| Muted text      | `--muted`   |

- Use color sparingly. Most UI should be black/white/gray with one accent.

### Spacing

```tsx
// ✅ Correct
<Stack gap={4}>...</Stack>

// ❌ Wrong
<div style={{ marginBottom: "16px" }}>...</div>
```

| Token          | Size    |
| -------------- | ------- |
| `--spacing-xs` | 0.25rem |
| `--spacing-sm` | 0.5rem  |
| `--spacing-md` | 1rem    |
| `--spacing-lg` | 1.5rem  |
| `--spacing-xl` | 2rem    |

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
@use "styles/mixins" as m;

.component {
  @include m.base-interactive; // border, shadow, transition
  background: var(--card-bg);

  @include m.brutalist-hover; // lift + shadow grow
  @include m.focus; // focus-visible ring
}
```

## Design Tokens

### Palette

Colors available in `palette` object. Shades follow Tailwind-style naming: `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`.

Access via `palette.{color}[{shade}]` (e.g., `palette.purple[500]`, `palette.slate[800]`).

| Color  | Shades Available | Notes                     |
| ------ | ---------------- | ------------------------- |
| black  | 50-950           | Opacity scales (rgba)     |
| white  | 50-950           | Opacity scales (rgba)     |
| slate  | 50-950           | Full range                |
| purple | 50-900           | Primary for default theme |
| navy   | 50-900           | —                         |
| blue   | 50-900           | Primary for captain theme |
| indigo | 50-900           | —                         |
| yellow | 50-900           | Primary for vigilante     |
| green  | 50-900           | Primary for doom theme    |
| red    | 50-900           | Error states              |
| gray   | 50-990           | Extended range            |

### Base Variables

#### Typography

```
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
--text-5xl: 3rem
--text-6xl: 3.75rem
```

#### Font Weights

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

#### Spacing

```
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 3rem
```

#### Z-Index

```
--z-base: 0
--z-elevated: 10
--z-header: 40
--z-dropdown: 50
--z-modal: 100
--z-overlay: 150
--z-drawer: 200
--z-tooltip: 500
```

#### Motion

```
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0.0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
```

#### Border Radius

```
--radius: 4px
--radius-pill: 9999px
--radius-full: 50%
```

#### Structural

```
--border-width: 2px
--shadow-hard: 4px 4px 0px 0px var(--shadow-base)
--shadow-hover: 6px 6px 0px 0px var(--shadow-base)
--shadow-sm: 2px 2px 0px 0px var(--card-border)
--shadow-lg: 8px 8px 0px 0px var(--card-border)
```

#### Outline (Focus States)

```
--outline-width: 2px
--outline-offset: 2px
```

#### Sizes

```
--size-icon-sm: 20px
--size-icon-md: 24px
--size-icon-lg: 32px
--size-touch-target: 44px
```

#### Overlay

```
--overlay-opacity: 0.5
```

## CSS Custom Properties

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

### Shadow Variables

| Variable           | Description                 |
| ------------------ | --------------------------- |
| `--shadow-base`    | Base shadow color           |
| `--shadow-primary` | Shadow for primary elements |
| `--shadow-error`   | Shadow for error states     |
| `--shadow-hard`    | Standard hard shadow        |
| `--shadow-hover`   | Hover state shadow          |
| `--shadow-sm`      | Small shadow                |
| `--shadow-lg`      | Large shadow                |

### Solid Variant Tokens

Used by `variant="solid"` on Modal, Sheet, Drawer, etc.

| Variable     | Description              |
| ------------ | ------------------------ |
| `--solid-bg` | Solid variant background |
| `--solid-fg` | Solid variant text       |

### Theme Values

| Theme       | `--primary` | `--background` | Mode  |
| ----------- | ----------- | -------------- | ----- |
| `default`   | Purple 500  | Indigo 100     | Light |
| `doom`      | Green 600   | Slate 950      | Dark  |
| `captain`   | Blue 500    | Slate 50       | Light |
| `vigilante` | Yellow 600  | Gray 950       | Dark  |

### Usage in SCSS

```scss
.myComponent {
  background: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  color: var(--foreground);
  box-shadow: var(--shadow-hard);
}
```

- Never hardcode hex values — always use CSS variables for theme compatibility.

## SCSS Mixins

Import with `@use "../../styles/mixins" as m;`.

### Interactive Element Mixins

#### `base-interactive`

Base styles for clickable elements (border, shadow, transition).

```scss
.myButton {
  @include m.base-interactive;
}
```

#### `focus`

Focus states with keyboard navigation support (`focus-visible`).

```scss
.myInput {
  @include m.focus;
}
```

#### `error`

Error state styling (red border + error shadow).

```scss
.myInput {
  &.hasError {
    @include m.error;
  }
}
```

#### `brutalist-hover($lift, $shadow-color)`

Hover effect with lift and shadow grow.

```scss
.myCard {
  @include m.brutalist-hover(2px, var(--shadow-base));
}
```

#### `active-press`

Active/pressed state styling.

```scss
.myButton {
  @include m.active-press;
}
```

#### `disabled-state`

Disabled styling with hatched pattern overlay.

```scss
.myButton:disabled {
  @include m.disabled-state;
}
```

### Theme Mixins

#### `invert-theme`

Inverts theme for content on primary-colored backgrounds.

#### `solid-variant`

Applies solid variant styling (used by Modal, Sheet, Drawer with `variant="solid"`).

### Shadow Mixins

#### `brutalist-shadow($direction, $size, $color)`

Directional hard shadows.

```scss
.myElement {
  @include m.brutalist-shadow("left", 8px, var(--shadow-base));
}
```

Directions: `standard`, `top`, `bottom`, `left`, `right`

### Responsive

#### `mq($breakpoint, $type)`

Media query helper.

```scss
.myElement {
  @include m.mq("md") {
    flex-direction: row;
  }
}
```

Breakpoints: `xxs` (360px), `xs` (480px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)

## Utility Classes

### Display

| Class          | Property               |
| -------------- | ---------------------- |
| `.flex`        | `display: flex`        |
| `.grid`        | `display: grid`        |
| `.hidden`      | `display: none`        |
| `.block`       | `display: block`       |
| `.inline-flex` | `display: inline-flex` |

### Flexbox

| Class              | Property                         |
| ------------------ | -------------------------------- |
| `.flex-row`        | `flex-direction: row`            |
| `.flex-col`        | `flex-direction: column`         |
| `.flex-wrap`       | `flex-wrap: wrap`                |
| `.items-center`    | `align-items: center`            |
| `.items-start`     | `align-items: flex-start`        |
| `.items-end`       | `align-items: flex-end`          |
| `.justify-center`  | `justify-content: center`        |
| `.justify-between` | `justify-content: space-between` |
| `.justify-end`     | `justify-content: flex-end`      |

### Grid

| Class               | Property                                |
| ------------------- | --------------------------------------- |
| `.grid-cols-{1-12}` | `grid-template-columns: repeat(n, 1fr)` |

### Spacing

All spacing uses 4px increments (0-10).

| Class         | Property           |
| ------------- | ------------------ |
| `.gap-{0-10}` | Gap                |
| `.m-{0-10}`   | Margin all         |
| `.mt-{0-10}`  | Margin top         |
| `.mb-{0-10}`  | Margin bottom      |
| `.mx-{0-10}`  | Margin horizontal  |
| `.my-{0-10}`  | Margin vertical    |
| `.p-{0-10}`   | Padding all        |
| `.px-{0-10}`  | Padding horizontal |
| `.py-{0-10}`  | Padding vertical   |

### Typography

| Class                   | Property                            |
| ----------------------- | ----------------------------------- |
| `.text-{xs-6xl}`        | Font size                           |
| `.font-{regular-black}` | Font weight                         |
| `.text-{color}`         | Color (primary, muted, error, etc.) |
| `.uppercase`            | Text transform                      |
| `.text-center`          | Text align                          |

### Sizing

| Class       | Property        |
| ----------- | --------------- |
| `.w-full`   | `width: 100%`   |
| `.h-full`   | `height: 100%`  |
| `.h-screen` | `height: 100vh` |

### Responsive Prefixes

Use breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`

```html
<div class="flex-col md:flex-row">
  <!-- Column on mobile, row on md+ -->
</div>
```

### Shadows

| Class                                  | Property                  |
| -------------------------------------- | ------------------------- |
| `.shadow-hard`                         | Standard brutalist shadow |
| `.shadow-{top/bottom/left/right}-hard` | Directional shadows       |
