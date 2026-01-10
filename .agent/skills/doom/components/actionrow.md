# ActionRow Component

## Import

```tsx
import { ActionRow } from "doom-design-system";
```

## Props

| Prop          | Type         | Description             |
| ------------- | ------------ | ----------------------- |
| `icon`        | `ReactNode`  | Icon on the left        |
| `title`       | `string`     | Main label              |
| `description` | `string`     | Optional secondary text |
| `onClick`     | `() => void` | Click handler           |

## Usage

```tsx
<ActionRow
  icon={<Settings size={20} />}
  title="Account Settings"
  description="Manage your profile and preferences"
  onClick={() => navigate("/settings")}
/>
```

## Guidelines

- Use for settings menus, navigation lists, or action items.
- Always provide an icon for visual consistency.
- Renders with a chevron indicator on the right.
