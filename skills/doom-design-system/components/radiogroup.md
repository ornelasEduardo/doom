# RadioGroup

## Import
```tsx
import { RadioGroup, RadioGroupItem } from "doom-design-system";
```

## Props

### RadioGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Form field name |
| `value` | `string` | — | Controlled selected value |
| `defaultValue` | `string` | — | Uncontrolled initial value |
| `onValueChange` | `(value: string) => void` | — | Change callback |
| `disabled` | `boolean` | — | Disable all items |

### RadioGroupItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Item value |
| `disabled` | `boolean` | — | Disable this item only |
| `children` | `ReactNode` | required | Label content |

## Usage

```tsx
<RadioGroup
  name="plan"
  value={selectedPlan}
  onValueChange={setSelectedPlan}
>
  <RadioGroupItem value="free">Free</RadioGroupItem>
  <RadioGroupItem value="pro">Pro</RadioGroupItem>
  <RadioGroupItem value="enterprise" disabled>
    Enterprise (Coming Soon)
  </RadioGroupItem>
</RadioGroup>
```

## Notes
- Use for single-select from 2–5 options; for larger sets use `Select` or `Combobox`
- `RadioGroupItem` must be a descendant of `RadioGroup` — context is required
- Individual items can be disabled while the group remains active
