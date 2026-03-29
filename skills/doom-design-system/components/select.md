# Select

## Import
```tsx
import { Select } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string \| number; label: string }[]` | required | Available options |
| `label` | `string` | — | Label text |
| `value` | `string \| number` | — | Controlled value |
| `defaultValue` | `string \| number` | — | Uncontrolled initial value |
| `onChange` | `(e: React.ChangeEvent<HTMLSelectElement>) => void` | — | Change handler — receives synthetic event |
| `placeholder` | `string` | — | Placeholder text |
| `name` | `string` | — | Form field name |
| `required` | `boolean` | — | Required field |
| `disabled` | `boolean` | — | Disabled state |
| `size` | `"sm" \| "md"` | `"md"` | Trigger size |

## Usage

```tsx
<Select
  label="Country"
  options={[
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
  ]}
  value={country}
  onChange={(e) => setCountry(e.target.value)}
/>
```

## Notes
- `onChange` provides a manually constructed synthetic event (not a native DOM event) — use `e.target.value` to read the selection
- For searchable or multi-select, use `Combobox` instead
- Includes a hidden native `<input>` for form submission compatibility
- Full keyboard navigation: Arrow keys to navigate, Enter to select, Escape to close
