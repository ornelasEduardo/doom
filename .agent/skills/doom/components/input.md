# Input Component

## Import

```tsx
import { Input } from "doom-design-system";
```

## Props

| Prop             | Type                             | Default | Description                         |
| ---------------- | -------------------------------- | ------- | ----------------------------------- |
| `label`          | `string`                         | —       | Label text above input              |
| `error`          | `string`                         | —       | Error message (shows in red)        |
| `helperText`     | `string`                         | —       | Helper text below input             |
| `startAdornment` | `ReactNode`                      | —       | Icon/element at start of input      |
| `endAdornment`   | `ReactNode`                      | —       | Icon/element at end of input        |
| `showCount`      | `boolean`                        | —       | Show character count                |
| `maxLength`      | `number`                         | —       | Max characters (auto-enables count) |
| `format`         | `(value) => string`              | —       | Display format when unfocused       |
| `validate`       | `(value) => string \| undefined` | —       | Custom validation on blur           |
| `required`       | `boolean`                        | —       | Mark as required                    |

Plus all standard `<input>` HTML attributes.

## Usage

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  type="email"
  required
/>

<Input
  label="Search"
  startAdornment={<Search size={16} />}
  endAdornment={<Button size="sm" variant="ghost">Clear</Button>}
/>

<Input
  label="Bio"
  maxLength={200}
  helperText="Brief description"
/>
```

## Guidelines

- Use `label` prop instead of external `<Label>` component for proper a11y binding.
- Use `error` prop for validation errors (shows as red text below).
- Use `startAdornment` for icons, `endAdornment` for action buttons.
- Character count auto-shows when `maxLength` is set.
