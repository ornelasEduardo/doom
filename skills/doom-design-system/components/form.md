# Form

## Import
```tsx
import { Form, Field, FormGroup, FormMessage } from "doom-design-system";
```

`FormGroup` is an alias for `Field` — use whichever reads better in context.

## Props

### Form

Extends all standard `<form>` HTML attributes (`onSubmit`, `action`, `method`, etc.).

### Field / FormGroup

Extends `React.HTMLAttributes<HTMLDivElement>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Field label (renders via `Label` component) |
| `error` | `string \| boolean` | — | Error message; `true` shows error styling without text |
| `description` | `string` | — | Helper description (hidden when `error` is present) |
| `htmlFor` | `string` | — | ID of the associated input element |
| `required` | `boolean` | — | Show required indicator on label |
| `className` | `string` | — | CSS class name |

### FormMessage

Extends `React.HTMLAttributes<HTMLSpanElement>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"error" \| "description"` | `"description"` | Message style |
| `children` | `ReactNode` | required | Message content |
| `className` | `string` | — | CSS class name |

## Usage

```tsx
// Standard form with Field
<Form onSubmit={handleSubmit}>
  <Field label="Email" required error={errors.email} htmlFor="email">
    <Input id="email" type="email" />
  </Field>

  <Field label="Password" description="Min 8 characters" htmlFor="password">
    <Input id="password" type="password" />
  </Field>

  <Button type="submit">Submit</Button>
</Form>

// Field wraps any input type — not just Input
<Field label="Role" htmlFor="role">
  <Select id="role" options={roles} />
</Field>

<Field label="Bio" htmlFor="bio">
  <Textarea id="bio" />
</Field>

<Field label="Notifications">
  <Switch />
</Field>

// Manual composition without Field
<Form>
  <Label required htmlFor="first-name">First Name</Label>
  <Input id="first-name" placeholder="John" />
  <FormMessage>Legal first name</FormMessage>
</Form>
```

## Notes
- `Field` does not auto-bind `htmlFor` — set it explicitly to match the input's `id`
- Description is automatically hidden when `error` is present (error takes priority)
- Error messages render with a shake animation
- `error={true}` applies error styling without showing any message text
- For simple single-input cases, prefer `Input`'s built-in `label` and `error` props — `Field` is for external error handling or custom/composite inputs
- `FormMessage` is standalone; use it outside `Field` when you need free-standing helper or error text
