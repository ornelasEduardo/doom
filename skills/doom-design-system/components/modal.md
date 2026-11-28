# Modal

## Import

```tsx
import { Modal } from "doom-design-system";
```

## Props

### Modal (root)

| Prop        | Type                   | Default     | Description                                           |
| ----------- | ---------------------- | ----------- | ----------------------------------------------------- |
| `isOpen`    | `boolean`              | required    | Controls visibility                                   |
| `onClose`   | `() => void`           | required    | Called on close requests and native form/command dismissal |
| `title`     | `ReactNode`            | —           | Title content (shorthand API)                         |
| `footer`    | `ReactNode`            | —           | Footer content (shorthand API)                        |
| `variant`   | `"default" \| "solid"` | `"default"` | Visual style                                          |
| `children`  | `ReactNode`            | required    | Modal body content                                    |
| `className` | `string`               | —           | CSS class name                                        |
| `style`     | `CSSProperties`        | —           | Inline styles                                         |

### Subcomponents

| Component      | Props                    | Description                                                  |
| -------------- | ------------------------ | ------------------------------------------------------------ |
| `Modal.Header` | `children`, `className?` | Header with built-in close button (hardcoded danger variant) |
| `Modal.Body`   | `children`, `className?` | Scrollable content area                                      |
| `Modal.Footer` | `children`, `className?` | Action buttons area                                          |

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
- Renders in an owned themed portal and opens in the native top layer; CSS contains scroll chaining where supported, without removing the page scrollbar
- Title auto-generates `aria-labelledby` linking; use `aria-label` when no title provided
- Animation: dialog and backdrop fade; reduced motion removes the transition
- Use `variant="solid"` for critical alerts or high-impact announcements
- Use composition API when you need custom header content (icons, status badges, etc.)

## Theme parts

For public parts, registered sizes and variants, see the [Modal theme contract](../../../THEME-REFERENCE.md#component-modal).

### Keyboard and nested overlays

Modal renders a native `dialog` and uses `showModal()`. The browser owns background inertness, focus containment, Escape cancellation and return to the invoker. Keep the controlled Modal mounted and change `isOpen` to permit its exit transition. `initialFocusRef` optionally points to a control to focus after opening. Nested Doom portals stay inside the dialog so selects and menus remain reachable in its top layer. Do not install an additional document Escape handler or focus trap around Modal.

Native `<form method="dialog">` dismissal calls `onClose` so controlled state stays synchronized. Update `isOpen` in this callback. Pointer dismissal requires the press to start outside the content, so selecting text does not accidentally close the dialog. Consumer `onClick` and `onPointerDown` handlers can prevent default dismissal.
