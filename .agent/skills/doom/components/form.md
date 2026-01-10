# Form Component

## Import

```tsx
import { Form, Field, FormMessage } from "doom-design-system";
```

## Components

### Form

Basic form wrapper with consistent styling.

### Field

Form field wrapper with label, error, and description support.

| Prop          | Type                | Description             |
| ------------- | ------------------- | ----------------------- |
| `label`       | `string`            | Field label             |
| `error`       | `string \| boolean` | Error message           |
| `description` | `string`            | Helper description      |
| `htmlFor`     | `string`            | Label target ID         |
| `required`    | `boolean`           | Show required indicator |

### FormMessage

Standalone message component.

| Prop      | Type                       | Default         | Description   |
| --------- | -------------------------- | --------------- | ------------- |
| `variant` | `"error" \| "description"` | `"description"` | Message style |

## Usage

```tsx
<Form onSubmit={handleSubmit}>
  <Field label="Email" required error={errors.email}>
    <Input id="email" type="email" />
  </Field>

  <Field label="Password" description="Min 8 characters">
    <Input id="password" type="password" />
  </Field>

  <Button type="submit">Submit</Button>
</Form>
```

## Guidelines

- Use `Field` to wrap form inputs for consistent label/error handling.
- Prefer using `Input`'s built-in `label` and `error` props for simple cases.
- Use `Field` when you need external error handling or custom inputs.
