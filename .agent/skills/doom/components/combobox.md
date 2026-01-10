# Combobox Component

## Import

```tsx
import { Combobox } from "doom-design-system";
```

## Props

| Prop          | Type                                 | Default       | Description                       |
| ------------- | ------------------------------------ | ------------- | --------------------------------- |
| `options`     | `{ value: string, label: string }[]` | required      | Available options                 |
| `value`       | `string \| string[]`                 | —             | Selected value(s)                 |
| `onChange`    | `(value) => void`                    | required      | Change handler                    |
| `placeholder` | `string`                             | `"Select..."` | Placeholder text                  |
| `multiple`    | `boolean`                            | `false`       | Allow multiple selection          |
| `searchable`  | `boolean`                            | `true`        | Enable search/filter              |
| `size`        | `"sm" \| "md"`                       | `"md"`        | Trigger size                      |
| `disabled`    | `boolean`                            | `false`       | Disabled state                    |
| `inline`      | `boolean`                            | `false`       | Render dropdown only (no trigger) |

## Usage

```tsx
<Combobox
  options={[
    { value: "red", label: "Red" },
    { value: "blue", label: "Blue" },
  ]}
  value={color}
  onChange={setColor}
  placeholder="Select color"
/>

// Multi-select
<Combobox
  multiple
  options={tags}
  value={selectedTags}
  onChange={setSelectedTags}
/>
```

## Guidelines

- Use for large option lists (virtualized for performance).
- Use `multiple` for tag/filter selection.
- Press Enter in search to select all filtered results (multi-select).
- "All" option automatically manages select/deselect all.
