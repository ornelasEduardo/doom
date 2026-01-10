# Badge Component

## Import

```tsx
import { Badge } from "doom-design-system";
```

## Props

| Prop       | Type                                                                         | Default     | Description   |
| ---------- | ---------------------------------------------------------------------------- | ----------- | ------------- |
| `variant`  | `"primary" \| "success" \| "warning" \| "error" \| "secondary" \| "outline"` | `"primary"` | Visual style  |
| `size`     | `"sm" \| "md" \| "lg"`                                                       | `"md"`      | Badge size    |
| `children` | `ReactNode`                                                                  | required    | Badge content |

## Usage

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="error" size="sm">Overdue</Badge>
<Badge variant="outline">Draft</Badge>
```

## Guidelines

- Use for status indicators, counts, or labels.
- Keep content short (1-2 words max).
- Use semantic colors: `success` for positive, `error` for negative, etc.
