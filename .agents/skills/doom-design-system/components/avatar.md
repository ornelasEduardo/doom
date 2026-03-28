# Avatar

## Import
```tsx
import { Avatar } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Image URL |
| `alt` | `string` | `"Avatar"` | Alt text |
| `fallback` | `ReactNode` | required | Fallback content when image fails (initials or icon) |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Avatar size |
| `shape` | `"circle" \| "square"` | `"square"` | Shape |

## Usage

```tsx
// Image with fallback
<Avatar src="/avatars/user.jpg" fallback="JD" size="lg" shape="circle" />

// Icon fallback
<Avatar fallback={<User size={20} />} />
```

## Notes
- `fallback` is required — always provide it for when image fails to load
- String fallbacks are auto-truncated to 2 characters
- Use `shape="circle"` for user profiles, `shape="square"` for entities/orgs
