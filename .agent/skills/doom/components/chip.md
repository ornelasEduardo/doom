# Chip Component

## Import

```tsx
import { Chip } from "doom-design-system";
```

## Props

| Prop        | Type                                                          | Default     | Description                       |
| ----------- | ------------------------------------------------------------- | ----------- | --------------------------------- |
| `variant`   | `"default" \| "primary" \| "success" \| "warning" \| "error"` | `"default"` | Visual style                      |
| `size`      | `"xs" \| "sm" \| "md" \| "lg" \| "xl"`                        | `"md"`      | Chip size                         |
| `onDismiss` | `() => void`                                                  | —           | Shows X button, called on dismiss |
| `onClick`   | `() => void`                                                  | —           | Makes chip clickable              |
| `disabled`  | `boolean`                                                     | `false`     | Disabled state                    |

## Usage

```tsx
<Chip>Default</Chip>

<Chip variant="primary" onDismiss={() => removeFilter()}>
  Filter: Active
</Chip>

<Chip onClick={() => toggleTag()}>Clickable Tag</Chip>
```

## Guidelines

- Use for tags, filters, or selectable items.
- `onDismiss` adds a dismiss button (X) on the right.
- `onClick` makes the entire chip interactive.
