# Tooltip

## Import
```tsx
import { Tooltip } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Tooltip text |
| `children` | `ReactNode` | required | Trigger element |
| `delay` | `number` | `200` | Show delay in ms |
| `placement` | `"top" \| "bottom"` | `"top"` | Position relative to trigger |

## Usage

```tsx
// Default tooltip above trigger
<Tooltip content="Save your changes">
  <Button>Save</Button>
</Tooltip>

// Bottom placement with adjusted delay
<Tooltip content="This action cannot be undone" placement="bottom" delay={0}>
  <Button variant="danger">Delete</Button>
</Tooltip>
```

## Notes
- Shows on both hover and focus — keyboard accessible by default
- Keep `content` brief — 1 sentence max
- Increase `delay` to prevent tooltip flicker during fast mouse movement
