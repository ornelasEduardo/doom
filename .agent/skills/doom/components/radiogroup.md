# RadioGroup Component

## Import

```tsx
import { RadioGroup, RadioGroupItem } from "doom-design-system";
```

## Props

### RadioGroup

| Prop            | Type                      | Default | Description                |
| --------------- | ------------------------- | ------- | -------------------------- |
| `name`          | `string`                  | —       | Form field name            |
| `value`         | `string`                  | —       | Controlled value           |
| `defaultValue`  | `string`                  | —       | Uncontrolled initial value |
| `onValueChange` | `(value: string) => void` | —       | Change callback            |
| `disabled`      | `boolean`                 | —       | Disable all items          |

### RadioGroupItem

| Prop       | Type        | Description       |
| ---------- | ----------- | ----------------- |
| `value`    | `string`    | Item value        |
| `disabled` | `boolean`   | Disable this item |
| `children` | `ReactNode` | Label content     |

## Usage

```tsx
<RadioGroup name="plan" value={selectedPlan} onValueChange={setSelectedPlan}>
  <RadioGroupItem value="free">Free</RadioGroupItem>
  <RadioGroupItem value="pro">Pro</RadioGroupItem>
  <RadioGroupItem value="enterprise" disabled>
    Enterprise (Coming Soon)
  </RadioGroupItem>
</RadioGroup>
```

## Guidelines

- Use for single-select from a small set of options (2-5).
- For larger option sets, use `Select` or `Combobox`.
- Items must be used within a RadioGroup context.
