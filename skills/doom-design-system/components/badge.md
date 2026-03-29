# Badge

## Import
```tsx
import { Badge } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "success" \| "warning" \| "error" \| "secondary" \| "outline"` | `"primary"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Badge size |
| `children` | `ReactNode` | required | Badge content |

## Usage

```tsx
// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="error" size="sm">Overdue</Badge>
<Badge variant="outline">Draft</Badge>
```

## Variants

| Variant | Use case |
|---------|----------|
| `primary` | Default/active states |
| `success` | Positive/complete states |
| `warning` | Caution/pending states |
| `error` | Negative/failed states |
| `secondary` | Neutral/inactive states |
| `outline` | Subtle/draft states |

## Notes
- Keep content short — 1–2 words max
- Use semantic colors: `success` for positive, `error` for negative
