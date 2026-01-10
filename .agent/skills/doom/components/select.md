# Select Component

## Import

```tsx
import { Select } from "doom-design-system";
```

## Props

| Prop           | Type                                           | Default  | Description                      |
| -------------- | ---------------------------------------------- | -------- | -------------------------------- |
| `options`      | `{ value: string \| number, label: string }[]` | required | Available options                |
| `label`        | `string`                                       | —        | Label text                       |
| `value`        | `string \| number`                             | —        | Controlled value                 |
| `defaultValue` | `string \| number`                             | —        | Uncontrolled initial value       |
| `onChange`     | `(e) => void`                                  | —        | Change handler (synthetic event) |
| `placeholder`  | `string`                                       | —        | Placeholder text                 |
| `name`         | `string`                                       | —        | Form field name                  |
| `required`     | `boolean`                                      | —        | Required field                   |
| `disabled`     | `boolean`                                      | —        | Disabled state                   |
| `size`         | `"sm" \| "md"`                                 | `"md"`   | Trigger size                     |

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

## Guidelines

- Use for single-select with moderate option count.
- For searchable/multi-select, use `Combobox` instead.
- Includes hidden input for form submission.
- Full keyboard navigation (Arrow keys, Enter, Escape).
