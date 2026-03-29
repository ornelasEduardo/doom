# Text

## Import
```tsx
import { Text } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "body" \| "small" \| "caption"` | `"body"` | Typography style |
| `weight` | `"normal" \| "medium" \| "semibold" \| "bold" \| "black"` | — | Font weight override |
| `color` | `"primary" \| "secondary" \| "muted" \| "error" \| "success" \| "warning"` | — | Text color token |
| `align` | `"left" \| "center" \| "right"` | — | Text alignment |
| `as` | `ElementType` | auto | Override rendered HTML element |
| `htmlFor` | `string` | — | For use with `as="label"` |

## Usage

```tsx
// Heading
<Text variant="h1">Page Title</Text>

// Body text
<Text variant="body">Regular paragraph text.</Text>

// Muted helper text
<Text variant="small" color="muted">Helper text or captions.</Text>

// Custom element override
<Text as="label" htmlFor="input" weight="semibold">Form Label</Text>
```

## Notes
- `h1`–`h6` variants auto-render as the corresponding heading element — use `as` to override
- `body`, `small`, `caption` use the body font; heading variants use the heading font
- `as` prop is useful when you need heading styles on a non-heading element (e.g. `as="span"`)
- Non-caption variants without an explicit `color` get `--foreground` applied by default
