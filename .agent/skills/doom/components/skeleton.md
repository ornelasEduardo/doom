# Skeleton Component

## Import

```tsx
import { Skeleton } from "doom-design-system";
```

## Props

| Prop      | Type                                    | Default         | Description |
| --------- | --------------------------------------- | --------------- | ----------- |
| `width`   | `string`                                | —               | CSS width   |
| `height`  | `string`                                | —               | CSS height  |
| `variant` | `"text" \| "circular" \| "rectangular"` | `"rectangular"` | Shape       |

## Usage

```tsx
// Text placeholder
<Skeleton variant="text" width="200px" height="1em" />

// Avatar placeholder
<Skeleton variant="circular" width="48px" height="48px" />

// Card placeholder
<Skeleton width="100%" height="150px" />
```

## Guidelines

- Use while loading content to prevent layout shift.
- Match skeleton dimensions to expected content size.
- Use `variant="text"` for text lines, `variant="circular"` for avatars.
- Used internally by `Image` component during load.
