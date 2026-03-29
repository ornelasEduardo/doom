# Skeleton

## Import
```tsx
import { Skeleton } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `string` | — | CSS width |
| `height` | `string` | — | CSS height |
| `variant` | `"text" \| "circular" \| "rectangular"` | `"rectangular"` | Shape preset |

## Usage

```tsx
// Text line placeholder
<Skeleton variant="text" width="200px" height="1em" />

// Avatar placeholder
<Skeleton variant="circular" width="48px" height="48px" />

// Card/image placeholder
<Skeleton width="100%" height="150px" />
```

## Notes
- `variant="text"` adds `margin-bottom: var(--spacing-2)` automatically for stacking text lines
- Use `variant="text"` for text lines, `variant="circular"` for avatars/icons
- Match skeleton dimensions to the expected content to prevent layout shift
- Used internally by the `Image` component during load — do not add manually in that case
