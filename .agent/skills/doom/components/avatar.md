# Avatar Component

## Import

```tsx
import { Avatar } from "doom-design-system";
```

## Props

| Prop       | Type                           | Default    | Description                 |
| ---------- | ------------------------------ | ---------- | --------------------------- |
| `src`      | `string`                       | —          | Image URL                   |
| `alt`      | `string`                       | `"Avatar"` | Alt text                    |
| `fallback` | `ReactNode`                    | required   | Fallback (initials or icon) |
| `size`     | `"sm" \| "md" \| "lg" \| "xl"` | `"md"`     | Avatar size                 |
| `shape`    | `"circle" \| "square"`         | `"square"` | Shape                       |

## Usage

```tsx
<Avatar
  src="/avatars/user.jpg"
  fallback="JD"
  size="lg"
  shape="circle"
/>

<Avatar fallback={<User size={20} />} />
```

## Guidelines

- Always provide a `fallback` for when image fails to load.
- String fallbacks are auto-truncated to 2 characters.
- Use `shape="circle"` for user profiles.
