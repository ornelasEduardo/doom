# Drawer Component

## Import

```tsx
import { Drawer } from "doom-design-system";
```

## Props

| Prop       | Type                   | Default     | Description         |
| ---------- | ---------------------- | ----------- | ------------------- |
| `isOpen`   | `boolean`              | required    | Controls visibility |
| `onClose`  | `() => void`           | required    | Close callback      |
| `title`    | `string`               | —           | Header title        |
| `side`     | `"left" \| "right"`    | `"right"`   | Slide direction     |
| `children` | `ReactNode`            | required    | Drawer content      |
| `footer`   | `ReactNode`            | —           | Footer content      |
| `variant`  | `"default" \| "solid"` | `"default"` | Visual style        |

## Usage

```tsx
<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
  footer={<Button onClick={save}>Save</Button>}
>
  <Stack gap={4}>{/* Settings form */}</Stack>
</Drawer>
```

## Guidelines

- Use for side panels, settings, or detail views.
- `side="left"` for navigation drawers, `side="right"` for actions/details.
- Closes on Escape key and overlay click.
- Use `variant="solid"` for high-emphasis content.
