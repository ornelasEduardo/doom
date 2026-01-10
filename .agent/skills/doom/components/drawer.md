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
| `title`    | `ReactNode`            | —           | Header title        |
| `side`     | `"left" \| "right"`    | `"right"`   | Slide direction     |
| `children` | `ReactNode`            | required    | Drawer content      |
| `footer`   | `ReactNode`            | —           | Footer content      |
| `variant`  | `"default" \| "solid"` | `"default"` | Visual style        |

## Usage Patterns

### Shorthand API (simple drawers)

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

### Composition API (custom layouts)

```tsx
<Drawer isOpen={isOpen} onClose={onClose} side="right">
  <Drawer.Header>
    <Text variant="h3">Custom Title</Text>
  </Drawer.Header>
  <Drawer.Body>
    <Stack gap={4}>{/* Custom content */}</Stack>
  </Drawer.Body>
  <Drawer.Footer>
    <Button variant="ghost" onClick={onClose}>
      Cancel
    </Button>
    <Button onClick={handleSave}>Save</Button>
  </Drawer.Footer>
</Drawer>
```

## Sub-components

| Component       | Description              |
| --------------- | ------------------------ |
| `Drawer.Header` | Header with close button |
| `Drawer.Body`   | Scrollable content area  |
| `Drawer.Footer` | Action buttons area      |

## Guidelines

- Use for side panels, settings, or detail views.
- `side="left"` for navigation drawers, `side="right"` for actions/details.
- Closes on Escape key and overlay click.
- Use `variant="solid"` for high-emphasis content.
- Use composition API when you need custom header content (icons, badges, etc.).
