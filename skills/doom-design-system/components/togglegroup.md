# ToggleGroup

## Import

```tsx
import { ToggleGroup, ToggleGroupItem } from "doom-design-system";
```

## Props

### ToggleGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"single" \| "multiple"` | — | Selection mode (required) |
| `value` | `string \| string[]` | — | Controlled value |
| `defaultValue` | `string \| string[]` | — | Uncontrolled initial value |
| `onValueChange` | `(value: string \| string[]) => void` | — | Callback when value changes |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Control size |
| `variant` | `"primary" \| "outline"` | `"outline"` | Visual variant |
| `disabled` | `boolean` | `false` | Disable all items |
| `className` | `string` | — | Additional CSS classes |
| `aria-label` | `string` | — | Accessible group label |

### ToggleGroupItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Item value (required) |
| `disabled` | `boolean` | — | Disable this item |
| `aria-label` | `string` | — | Accessible label (use when children are icons) |
| `className` | `string` | — | Additional CSS classes |
| `children` | `ReactNode` | — | Item content |

## Usage

```tsx
// Single select (text alignment)
<ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft size={16} strokeWidth={2.5} />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter size={16} strokeWidth={2.5} />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight size={16} strokeWidth={2.5} />
  </ToggleGroupItem>
</ToggleGroup>

// Multiple select (text formatting)
<ToggleGroup type="multiple" defaultValue={["bold"]} aria-label="Text formatting">
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
  <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
</ToggleGroup>

// Controlled
const [value, setValue] = useState("left");
<ToggleGroup type="single" value={value} onValueChange={v => setValue(v as string)}>
  ...
</ToggleGroup>
```

## Notes

- `type="single"` uses `string` for value; `type="multiple"` uses `string[]`
- In single mode, clicking the active item deselects it (value becomes `""`)
- `ToggleGroupItem` must be a direct child of `ToggleGroup` — using it outside throws an error
- Keyboard navigation uses roving tabindex: arrow keys move focus, Space/Enter toggles
- Disabled items are skipped in keyboard navigation
- When using icon-only items, always provide `aria-label` on each `ToggleGroupItem`
