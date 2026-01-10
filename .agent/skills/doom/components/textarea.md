# Textarea Component

## Import

```tsx
import { Textarea } from "doom-design-system";
```

## Props

| Prop         | Type      | Default | Description                         |
| ------------ | --------- | ------- | ----------------------------------- |
| `label`      | `string`  | —       | Label text                          |
| `error`      | `string`  | —       | Error message                       |
| `helperText` | `string`  | —       | Helper text below textarea          |
| `showCount`  | `boolean` | —       | Show character count                |
| `maxLength`  | `number`  | —       | Max characters (auto-enables count) |

Plus all standard `<textarea>` attributes.

## Usage

```tsx
<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
/>

<Textarea
  label="Bio"
  maxLength={500}
  helperText="Brief description of yourself"
/>

<Textarea
  label="Notes"
  error="This field is required"
/>
```

## Guidelines

- Same API pattern as `Input` component.
- Use `maxLength` for character limits (auto-shows counter).
- Use `rows` to control initial height.
