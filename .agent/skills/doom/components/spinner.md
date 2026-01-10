# Spinner Component

## Import

```tsx
import { Spinner } from "doom-design-system";
```

## Props

| Prop          | Type                           | Default | Description    |
| ------------- | ------------------------------ | ------- | -------------- |
| `size`        | `"sm" \| "md" \| "lg" \| "xl"` | `"md"`  | Spinner size   |
| `strokeWidth` | `number`                       | `2`     | Line thickness |

Plus all Lucide icon props.

## Usage

```tsx
<Spinner />

<Spinner size="lg" />

<Button loading>
  {/* Button uses Spinner internally when loading */}
</Button>
```

## Guidelines

- Use for loading states.
- Prefer `Button`'s `loading` prop instead of manually adding Spinner.
- Has `role="status"` and `aria-label="Loading"` for accessibility.
