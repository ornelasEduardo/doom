# Spinner

## Import
```tsx
import { Spinner } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Spinner size |
| `strokeWidth` | `number` | `2` | Line thickness |

Extends all Lucide icon props.

## Usage

```tsx
// Default spinner
<Spinner />

// Large spinner
<Spinner size="lg" />

// Button uses Spinner internally — prefer the loading prop
<Button loading>Saving...</Button>
```

## Notes
- Has `role="status"` and `aria-label="Loading"` built in for accessibility
- Prefer `Button`'s `loading` prop over manually placing a `Spinner` inside a button
