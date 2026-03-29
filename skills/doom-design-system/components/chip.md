# Chip

## Import
```tsx
import { Chip } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "primary" \| "success" \| "warning" \| "error"` | `"default"` | Visual style |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Chip size |
| `onDismiss` | `() => void` | — | Shows X button; called on dismiss |
| `onClick` | `(e: React.MouseEvent) => void` | — | Makes chip clickable (adds `tabIndex={0}` and keyboard support) |
| `disabled` | `boolean` | `false` | Disabled state |
| `children` | `ReactNode` | required | Chip content |

## Usage

```tsx
// Static chip
<Chip>Default</Chip>

// Dismissible filter chip
<Chip variant="primary" onDismiss={() => removeFilter()}>
  Filter: Active
</Chip>

// Clickable tag
<Chip onClick={() => toggleTag()}>Clickable Tag</Chip>
```

## Notes
- `onDismiss` adds an X button on the right side of the chip
- `onClick` makes the entire chip interactive (button behavior)
- Both `onDismiss` and `onClick` can be provided simultaneously
