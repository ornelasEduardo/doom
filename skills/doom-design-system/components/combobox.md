# Combobox

## Import
```tsx
import { Combobox } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `{ value: string; label: string }[]` | required | Available options |
| `value` | `string \| string[]` | — | Controlled selected value(s) |
| `onChange` | `(value: string \| string[]) => void` | required | Change handler |
| `placeholder` | `string` | `"Select..."` | Placeholder text |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `searchable` | `boolean` | `true` | Enable search/filter input |
| `size` | `"sm" \| "md"` | `"md"` | Trigger size |
| `disabled` | `boolean` | `false` | Disabled state |
| `inline` | `boolean` | `false` | Render dropdown only — no trigger button |

## Usage

```tsx
// Single select
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

## Notes
- List is virtualized — safe to pass large option arrays
- In multi-select mode, pressing Enter in the search field selects all currently filtered results
- An "All" option is automatically managed for select/deselect all in multi-select mode
- Use `Select` instead when search is not needed and the option count is small
