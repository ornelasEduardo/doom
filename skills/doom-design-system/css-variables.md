# CSS Variables

Theme-aware CSS variables defined in `styles/themes/definitions.ts`. These change per theme and are set via `DesignSystemProvider`.

For static tokens (spacing, typography, z-index, etc.) see `styles.md`.

## Color Variables

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

## Surface Variables

| Variable                     | Description             |
| ---------------------------- | ----------------------- |
| `--surface-brand`            | Branded surface bg      |
| `--surface-brand-foreground` | Text on branded surface |
| `--surface-accent`           | Accent surface bg       |
| `--on-surface`               | Text on any surface     |
| `--on-surface-muted`         | Muted text on surface   |

## Shadow Variables (Theme-Dependent)

| Variable           | Description                 |
| ------------------ | --------------------------- |
| `--shadow-base`    | Base shadow color           |
| `--shadow-primary` | Shadow for primary elements |
| `--shadow-error`   | Shadow for error states     |

Note: `--shadow-hard`, `--shadow-hover`, `--shadow-sm`, `--shadow-lg` are static tokens defined in `_tokens.scss` — they reference `--shadow-base` and `--card-border` which are theme-dependent.

## Solid Variant Tokens

Generated via `createSolidTokens(bg, fg, semantics)` in `styles/themes/solid-tokens.ts`. Used by `variant="solid"` on Modal, Sheet, Drawer, etc.

| Variable          | Description              |
| ----------------- | ------------------------ |
| `--solid-bg`      | Solid variant background |
| `--solid-fg`      | Solid variant text       |
| `--solid-success` | Success on solid bg      |
| `--solid-error`   | Error on solid bg        |
| `--solid-warning` | Warning on solid bg      |

## Theme Values

| Theme       | `--primary`   | `--background` | `--shadow-base` | Mode  |
| ----------- | ------------- | -------------- | --------------- | ----- |
| `default`   | Purple 500    | Indigo 100     | Black 950       | Light |
| `doom`      | Green 600     | Slate 950      | Black 950       | Dark  |
| `captain`   | Blue 500      | Slate 50       | Black 950       | Light |
| `vigilante` | Yellow 600    | Gray 950       | Black 950       | Dark  |

Each theme defines all color, surface, shadow, and solid tokens. See `styles/themes/definitions.ts` for exact hex values.

## Usage in SCSS

```scss
.myComponent {
  background: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  color: var(--foreground);
  box-shadow: var(--shadow-hard);
}
```

**Never hardcode hex values** — always use CSS variables for theme compatibility.
