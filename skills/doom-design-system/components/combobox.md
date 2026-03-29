# Combobox

## Import
```tsx
import { Combobox } from "doom-design-system";
import type { ComboboxOption } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ComboboxOption[]` | required | Available options |
| `value` | `string \| string[] \| undefined` | — | Controlled selected value(s) |
| `onChange` | `(value: string \| string[] \| undefined) => void` | required | Change handler (`undefined` when all cleared) |
| `placeholder` | `string` | `"Select..."` | Placeholder text |
| `multiple` | `boolean` | `false` | Allow multiple selection |
| `searchable` | `boolean` | `true` | Enable search/filter input |
| `size` | `"sm" \| "md"` | `"md"` | Trigger size |
| `disabled` | `boolean` | `false` | Disabled state |
| `inline` | `boolean` | `false` | Render dropdown only — no trigger button |
| `className` | `string` | — | CSS class name |

### ComboboxOption

```tsx
interface ComboboxOption {
  value: string;
  label: string;
}
```

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
- List is virtualized (`@tanstack/react-virtual`, 36px row height, 5-item overscan) — safe for large option arrays
- Search uses regex matching with substring fallback on invalid patterns
- In multi-select mode, pressing Enter in the search field selects all currently filtered results
- An "All" option appears as a sticky element at the top in multi-select mode for select/deselect all
- Single-select: closes dropdown and clears search on selection
- Clear button (X) clears both the value and search query
- Dropdown width: min 20ch, max 40ch; positioned via `Popover` with `placement="bottom-start"`
- Disabled state renders at 50% opacity
- Empty state shows "No results" message
- Also exports `useComboboxFilter` hook for accessing search/filter state separately
