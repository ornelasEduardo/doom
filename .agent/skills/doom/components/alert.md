# Alert Component

## Import

```tsx
import { Alert } from "doom-design-system";
```

## Props

| Prop          | Type                                          | Default  | Description                       |
| ------------- | --------------------------------------------- | -------- | --------------------------------- |
| `variant`     | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Visual style                      |
| `title`       | `string`                                      | required | Alert heading                     |
| `description` | `ReactNode`                                   | —        | Additional content                |
| `icon`        | `ReactNode`                                   | —        | Custom icon (defaults by variant) |

## Usage

```tsx
<Alert
  variant="error"
  title="Invalid credentials"
  description="Please check your email and password."
/>

<Alert variant="success" title="Changes saved!" />
```

## Guidelines

- Use `error` for form validation, API errors.
- Use `success` for confirmations.
- Use `warning` for cautions/deprecations.
- Use `info` for general notices.
