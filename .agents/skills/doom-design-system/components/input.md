# Input

## Import
```tsx
import { Input } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Label text above input |
| `error` | `string` | — | Error message — displayed in red below input |
| `helperText` | `string` | — | Helper text below input |
| `startAdornment` | `ReactNode` | — | Icon or element at the start of the input |
| `endAdornment` | `ReactNode` | — | Icon or element at the end of the input |
| `showCount` | `boolean` | — | Show character count |
| `maxLength` | `number` | — | Max character count — auto-enables character counter |
| `format` | `(value: string) => string` | — | Display formatter applied when input is unfocused |
| `validate` | `(value: string) => string \| undefined` | — | Custom validation called on blur |
| `required` | `boolean` | — | Mark field as required |

Extends all standard `<input>` HTML attributes.

## Usage

```tsx
// Email input with label
<Input label="Email" placeholder="you@example.com" type="email" required />

// Input with adornments
<Input
  label="Search"
  startAdornment={<Search size={16} />}
  endAdornment={<Button size="sm" variant="ghost">Clear</Button>}
/>

// Character-limited input
<Input label="Bio" maxLength={200} helperText="Brief description" />
```

## Notes
- Use `label` prop instead of a separate `<Label>` component — it handles the `htmlFor`/`id` binding automatically
- Character count auto-shows when `maxLength` is set; `showCount` is redundant in that case
- `format` only applies when the input is blurred — useful for currency or phone number display formatting
- `validate` runs on blur and overrides `error` if it returns a string
