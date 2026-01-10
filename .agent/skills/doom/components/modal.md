# Modal Component

## Import

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from "doom-design-system";
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

### Shorthand API (recommended for simple modals)

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

### Composition API (for custom layouts)

```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader>
    <Text variant="h3">Custom Title</Text>
  </ModalHeader>
  <ModalBody>
    <Stack gap={4}>
      <Text>Custom body content...</Text>
    </Stack>
  </ModalBody>
  <ModalFooter>
    <Button onClick={onClose}>Close</Button>
  </ModalFooter>
</Modal>
```

## Guidelines

- Use `variant="solid"` for high-impact announcements or critical alerts.
- Modal closes on Escape key and overlay click automatically.
- Always provide meaningful `title` or `aria-label` for accessibility.
