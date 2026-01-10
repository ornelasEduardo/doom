# Button Component

## Import

```tsx
import { Button } from "doom-design-system";
```

## Props

| Prop       | Type                                                                        | Default     | Description                           |
| ---------- | --------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| `variant`  | `"primary" \| "secondary" \| "ghost" \| "outline" \| "success" \| "danger"` | `"primary"` | Visual style                          |
| `size`     | `"sm" \| "md" \| "lg"`                                                      | `"md"`      | Button size                           |
| `loading`  | `boolean`                                                                   | `false`     | Show loading spinner, disables button |
| `disabled` | `boolean`                                                                   | `false`     | Disable the button                    |

Plus all standard `<button>` HTML attributes.

## Usage

```tsx
<Button variant="primary" onClick={handleClick}>
  Submit
</Button>

<Button loading variant="danger">
  Deleting...
</Button>

<Button variant="ghost" size="sm">
  Cancel
</Button>
```

## Guidelines

- Use `primary` for main actions (submit, save, confirm).
- Use `secondary` for less prominent actions.
- Use `ghost` for tertiary/cancel actions.
- Use `danger` for destructive actions (delete, remove).
- Use `success` sparingly for positive confirmations.
- Always use `loading` prop instead of manually disabling + adding spinner.
