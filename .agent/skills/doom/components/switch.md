# Switch Component

## Import

```tsx
import { Switch } from "doom-design-system";
```

## Props

| Prop       | Type                         | Default | Description              |
| ---------- | ---------------------------- | ------- | ------------------------ |
| `checked`  | `boolean`                    | `false` | Controlled checked state |
| `onChange` | `(checked: boolean) => void` | —       | Change handler           |
| `disabled` | `boolean`                    | —       | Disabled state           |
| `label`    | `string`                     | —       | Label text               |
| `readOnly` | `boolean`                    | —       | Read-only state          |

## Usage

```tsx
<Switch
  label="Dark Mode"
  checked={darkMode}
  onChange={setDarkMode}
/>

<Switch
  label="Notifications"
  checked={notifications}
  onChange={setNotifications}
  disabled={!hasPermission}
/>
```

## Guidelines

- Use for binary on/off toggles.
- Prefer `Switch` over `Checkbox` for instant-apply settings.
- Use `Checkbox` for forms that require explicit submission.
