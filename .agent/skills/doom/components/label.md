# Label Component

## Import

```tsx
import { Label } from "doom-design-system";
```

## Props

| Prop       | Type        | Default  | Description                  |
| ---------- | ----------- | -------- | ---------------------------- |
| `children` | `ReactNode` | required | Label content                |
| `required` | `boolean`   | —        | Show required indicator (\*) |
| `htmlFor`  | `string`    | —        | Associated input ID          |

Plus all standard `<label>` attributes.

## Usage

```tsx
<Label htmlFor="email" required>
  Email Address
</Label>
<Input id="email" type="email" />
```

## Guidelines

- Prefer using `Input`'s built-in `label` prop for standard cases.
- Use `Label` directly when you need custom label layouts.
- Works with all form components (Input, Select, Textarea, etc.).
