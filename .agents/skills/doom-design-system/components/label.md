# Label

## Import
```tsx
import { Label } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Label content |
| `required` | `boolean` | — | Show required indicator (*) |
| `htmlFor` | `string` | — | ID of the associated input |

Extends all standard `<label>` HTML attributes.

## Usage

```tsx
// Label manually associated with an input
<Label htmlFor="email" required>
  Email Address
</Label>
<Input id="email" type="email" />
```

## Notes
- Prefer `Input`'s built-in `label` prop for standard single-input cases — it auto-binds the association
- Use `Label` directly when you need custom label layouts, composite inputs, or a label for a non-Doom input element
- Works with all form components: `Input`, `Select`, `Textarea`, `Checkbox`, etc.
