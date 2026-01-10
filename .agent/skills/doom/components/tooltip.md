# Tooltip Component

## Import

```tsx
import { Tooltip } from "doom-design-system";
```

## Props

| Prop        | Type                | Default  | Description      |
| ----------- | ------------------- | -------- | ---------------- |
| `content`   | `string`            | required | Tooltip text     |
| `children`  | `ReactNode`         | required | Trigger element  |
| `delay`     | `number`            | `200`    | Show delay in ms |
| `placement` | `"top" \| "bottom"` | `"top"`  | Position         |

## Usage

```tsx
<Tooltip content="Save your changes">
  <Button>Save</Button>
</Tooltip>

<Tooltip content="This action cannot be undone" placement="bottom">
  <Button variant="danger">Delete</Button>
</Tooltip>
```

## Guidelines

- Use for brief explanatory text on hover/focus.
- Keep content short (1 sentence max).
- Shows on hover and focus for accessibility.
- Use `delay` to prevent tooltip flicker on quick hovers.
