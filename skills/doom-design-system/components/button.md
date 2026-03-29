# Button

## Import
```tsx
import { Button } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "outline" \| "success" \| "danger"` | `"primary"` | Visual style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `loading` | `boolean` | `false` | Show loading spinner and disable button |
| `disabled` | `boolean` | `false` | Disable the button |

Extends all standard `<button>` HTML attributes.

## Usage

```tsx
// Primary action
<Button variant="primary" onClick={handleClick}>Submit</Button>

// Destructive action with loading state
<Button loading variant="danger">Deleting...</Button>

// Tertiary/cancel action
<Button variant="ghost" size="sm">Cancel</Button>
```

## Variants

| Variant | Use case |
|---------|----------|
| `primary` | Main actions — submit, save, confirm |
| `secondary` | Secondary actions |
| `ghost` | Tertiary and cancel actions |
| `outline` | Mid-emphasis alternative to secondary |
| `danger` | Destructive actions — delete, remove |
| `success` | Positive confirmation — use sparingly |

## Notes
- Use `loading` prop instead of manually disabling the button and adding a spinner — it handles both automatically
- `loading` sets `disabled` internally — they combine with OR logic (`disabled={disabled || loading}`), so passing both is safe but redundant
