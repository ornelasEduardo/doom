# Design Tokens

Tokens are defined in `styles/tokens.ts`.

## Palette

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

## Base Variables

### Typography

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

### Spacing

```
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 3rem
```

### Z-Index

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

### Motion

```
--duration-fast: 150ms
--duration-normal: 250ms
--duration-slow: 350ms
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
--ease-out: cubic-bezier(0.0, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
```

### Border Radius

```
--radius: 4px
--radius-pill: 9999px
--radius-full: 50%
```

### Structural

```
--border-width: 2px
--shadow-hard: 4px 4px 0px 0px var(--shadow-base)
--shadow-hover: 6px 6px 0px 0px var(--shadow-base)
--shadow-sm: 2px 2px 0px 0px var(--card-border)
--shadow-lg: 8px 8px 0px 0px var(--card-border)
```

### Outline (Focus States)

```
--outline-width: 2px
--outline-offset: 2px
```

### Sizes

```
--size-icon-sm: 20px
--size-icon-md: 24px
--size-icon-lg: 32px
--size-touch-target: 44px
```

### Overlay

```
--overlay-opacity: 0.5
```
