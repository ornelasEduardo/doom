# Drawer

## Import
```tsx
import { Drawer } from "doom-design-system";
```

## Props

### Drawer (root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Close callback |
| `side` | `"left" \| "right"` | `"right"` | Slide direction |
| `title` | `ReactNode` | — | Header title (shorthand API) |
| `footer` | `ReactNode` | — | Footer content (shorthand API) |
| `variant` | `"default" \| "solid"` | `"default"` | Visual style |
| `children` | `ReactNode` | required | Drawer content |
| `className` | `string` | — | CSS class name |

### Subcomponents

| Component | Props | Description |
|-----------|-------|-------------|
| `Drawer.Header` | `children`, `className?` | Header with built-in close button (hardcoded danger variant) |
| `Drawer.Body` | `children`, `className?` | Scrollable content area |
| `Drawer.Footer` | `children`, `className?` | Action buttons area |

## Usage

```tsx
// Shorthand API
<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
  footer={<Button onClick={save}>Save</Button>}
>
  <Stack gap={4}>{/* Settings form */}</Stack>
</Drawer>

// Composition API — custom header content
<Drawer isOpen={isOpen} onClose={onClose} side="right">
  <Drawer.Header>
    <Text variant="h3">Custom Title</Text>
  </Drawer.Header>
  <Drawer.Body>
    <Stack gap={4}>{/* Content */}</Stack>
  </Drawer.Body>
  <Drawer.Footer>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </Drawer.Footer>
</Drawer>
```

## Notes
- Closes on Escape key and overlay click automatically
- Renders via portal to `document.body`; locks body scroll when open
- Animation: slides in from the specified side; directional shadow matches `side`
- Border radius only on the non-screen-edge side
- Use `side="left"` for navigation drawers, `side="right"` for detail/action panels
- `variant="solid"` for high-emphasis content
