# Modal Component

## Import

```tsx
import { Modal } from "doom-design-system";
```

## Props

| Prop      | Type                   | Default     | Description                                           |
| --------- | ---------------------- | ----------- | ----------------------------------------------------- |
| `isOpen`  | `boolean`              | required    | Controls visibility                                   |
| `onClose` | `() => void`           | required    | Called on close (Escape, overlay click, close button) |
| `title`   | `ReactNode`            | —           | Title content (uses shorthand API if provided)        |
| `footer`  | `ReactNode`            | —           | Footer content (uses shorthand API if provided)       |
| `variant` | `"default" \| "solid"` | `"default"` | Visual style                                          |

## Usage Patterns

### Shorthand API (simple modals)

```tsx
<Modal
  isOpen={isOpen}
  title={<Text variant="h4">Confirm Action</Text>}
  footer={
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </>
  }
  onClose={onClose}
>
  <Text>Are you sure you want to proceed?</Text>
</Modal>
```

### Composition API (custom layouts)

```tsx
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

## Sub-components

| Component      | Description              |
| -------------- | ------------------------ |
| `Modal.Header` | Header with close button |
| `Modal.Body`   | Scrollable content area  |
| `Modal.Footer` | Action buttons area      |

## Guidelines

- Use `variant="solid"` for high-impact announcements or critical alerts.
- Modal closes on Escape key and overlay click automatically.
- Always provide meaningful `title` or `aria-label` for accessibility.
