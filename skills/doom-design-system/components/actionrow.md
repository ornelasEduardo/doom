# ActionRow

## Import
```tsx
import { ActionRow } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Main label |
| `icon` | `ReactNode` | — | Icon on the left |
| `description` | `string` | — | Optional secondary text |
| `onClick` | `() => void` | — | Click handler |

## Usage

```tsx
// Settings navigation row
<ActionRow
  icon={<Settings size={20} />}
  title="Account Settings"
  description="Manage your profile and preferences"
  onClick={() => navigate("/settings")}
/>

// Without description
<ActionRow
  icon={<LogOut size={20} />}
  title="Sign Out"
  onClick={handleSignOut}
/>
```

## Notes
- Renders a chevron indicator on the right side automatically
- Always provide an `icon` for visual consistency across lists
- Suited for settings menus, navigation lists, and action item lists
