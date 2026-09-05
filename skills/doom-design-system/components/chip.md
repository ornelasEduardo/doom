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
| `onKeyDown` | `React.KeyboardEventHandler<HTMLDivElement>` | — | Runs before built-in keyboard activation; `preventDefault()` cancels activation |
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
- When the clickable chip root is focused, Enter or Space activates `onClick` on keydown with a mouse click event; Space scrolling is prevented
- Disabled chips do not activate from clicks or keyboard input
- Keyboard events from the nested dismiss button do not activate the chip or prevent the button’s native behavior; dismiss clicks only call `onDismiss`
- The root remains a `div`, including its forwarded ref and HTML attribute types
