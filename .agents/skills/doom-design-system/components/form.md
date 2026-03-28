# Form

## Import
```tsx
import { Form, Field, FormMessage } from "doom-design-system";
```

## Props

### Form

Extends all standard `<form>` HTML attributes.

### Field

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Field label |
| `error` | `string \| boolean` | — | Error message; `true` shows error styling without text |
| `description` | `string` | — | Helper description below the input |
| `htmlFor` | `string` | — | ID of the associated input element |
| `required` | `boolean` | — | Show required indicator |

### FormMessage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"error" \| "description"` | `"description"` | Message style |

## Usage

```tsx
<Form onSubmit={handleSubmit}>
  <Field label="Email" required error={errors.email} htmlFor="email">
    <Input id="email" type="email" />
  </Field>

  <Field label="Password" description="Min 8 characters" htmlFor="password">
    <Input id="password" type="password" />
  </Field>

  <Button type="submit">Submit</Button>
</Form>
```

## Notes
- For simple single-input cases, prefer `Input`'s built-in `label` and `error` props — `Field` is for external error handling or custom/composite inputs
- `Field` does not auto-bind `htmlFor` — set it explicitly to match the input's `id`
- `FormMessage` is standalone; use it when you need a message outside of a `Field` context
