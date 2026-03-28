# Modal

## Import
```tsx
import { Modal } from "doom-design-system";
```

## Props

### Modal (root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Called on close (Escape, overlay click, close button) |
| `title` | `ReactNode` | — | Title content (shorthand API) |
| `footer` | `ReactNode` | — | Footer content (shorthand API) |
| `variant` | `"default" \| "solid"` | `"default"` | Visual style |
| `children` | `ReactNode` | required | Modal body content |

### Sub-component Props

| Component | Props | Description |
|-----------|-------|-------------|
| `Modal.Header` | `children: ReactNode` | Header area with built-in close button |
| `Modal.Body` | `children: ReactNode` | Scrollable content area |
| `Modal.Footer` | `children: ReactNode` | Action buttons area |

## Usage

```tsx
// Shorthand API
<Modal
  isOpen={isOpen}
  title={<Text variant="h4">Confirm Action</Text>}
  footer={
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </>
  }
  onClose={onClose}
>
  <Text>Are you sure you want to proceed?</Text>
</Modal>

// Composition API — full control over layout
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>
    <Text variant="h3">Custom Title</Text>
  </Modal.Header>
  <Modal.Body>
    <Stack gap={4}>
      <Text>Custom body content...</Text>
    </Stack>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={onClose}>Close</Button>
  </Modal.Footer>
</Modal>
```

## Notes
- Closes on Escape key and overlay click automatically
- Always provide meaningful `title` or `aria-label` for screen reader accessibility
- Use `variant="solid"` for critical alerts or high-impact announcements
- Use composition API when you need custom header content (icons, status badges, etc.)
