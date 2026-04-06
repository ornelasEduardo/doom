# Checkbox

## Import
```tsx
import { Checkbox } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Label text — auto-binds to the input for accessibility |
| `checked` | `boolean` | — | Controlled checked state |
| `defaultChecked` | `boolean` | — | Uncontrolled initial state |
| `disabled` | `boolean` | — | Disabled state |
| `indeterminate` | `boolean` | `false` | Shows indeterminate (minus) state. Overridden by `checked`. Used for parent checkboxes in tree selections. |
| `error` | `boolean` | — | Error state |
| `onChange` | `(e: React.ChangeEvent<HTMLInputElement>) => void` | — | Change handler |

Extends all standard `<input type="checkbox">` attributes.

## Usage

```tsx
// Uncontrolled
<Checkbox label="I agree to the terms" />

// Controlled
<Checkbox
  label="Subscribe to newsletter"
  checked={subscribed}
  onChange={(e) => setSubscribed(e.target.checked)}
/>
```

## Notes
- Always use the `label` prop for accessibility — it auto-binds via `htmlFor`/`id`; do not use a separate `<Label>` alongside it
- Use `Checkbox` for binary choices or multi-select lists
- Use `RadioGroup` for mutually exclusive single-select options
