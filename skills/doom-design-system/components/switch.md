# Switch

## Import
```tsx
import { Switch } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Controlled checked state |
| `onChange` | `(checked: boolean) => void` | — | Change handler — receives boolean directly |
| `disabled` | `boolean` | — | Disabled state |
| `label` | `string` | — | Label text |
| `readOnly` | `boolean` | — | Read-only state |

## Usage

```tsx
// Controlled switch
<Switch label="Dark Mode" checked={darkMode} onChange={setDarkMode} />

// Conditionally disabled
<Switch
  label="Notifications"
  checked={notifications}
  onChange={setNotifications}
  disabled={!hasPermission}
/>
```

## Notes
- `onChange` receives a boolean directly — not a synthetic event; no `e.target.checked` needed
- Use `Switch` for instant-apply settings (toggles take effect immediately)
- Use `Checkbox` instead when the setting requires form submission to apply
