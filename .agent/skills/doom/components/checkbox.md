# Checkbox Component

## Import

```tsx
import { Checkbox } from "doom-design-system";
```

## Props

| Prop             | Type          | Default | Description                |
| ---------------- | ------------- | ------- | -------------------------- |
| `label`          | `string`      | —       | Label text                 |
| `error`          | `boolean`     | —       | Error state                |
| `checked`        | `boolean`     | —       | Controlled checked state   |
| `defaultChecked` | `boolean`     | —       | Uncontrolled initial state |
| `disabled`       | `boolean`     | —       | Disabled state             |
| `onChange`       | `(e) => void` | —       | Change handler             |

Plus all standard `<input type="checkbox">` attributes.

## Usage

```tsx
<Checkbox label="I agree to the terms" />

<Checkbox
  label="Subscribe to newsletter"
  checked={subscribed}
  onChange={(e) => setSubscribed(e.target.checked)}
/>
```

## Guidelines

- Use `label` prop for accessibility (auto-binds label to input).
- Use for binary choices or multi-select lists.
- Use `RadioGroup` for single-select from multiple options.
