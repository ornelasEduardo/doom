# Sheet Component

## Import

```tsx
import { Sheet } from "doom-design-system";
```

## Props

| Prop       | Type                   | Default     | Description         |
| ---------- | ---------------------- | ----------- | ------------------- |
| `isOpen`   | `boolean`              | required    | Controls visibility |
| `onClose`  | `() => void`           | required    | Close callback      |
| `title`    | `ReactNode`            | —           | Header title        |
| `children` | `ReactNode`            | required    | Sheet content       |
| `footer`   | `ReactNode`            | —           | Footer content      |
| `variant`  | `"default" \| "solid"` | `"default"` | Visual style        |

## Usage Patterns

### Shorthand API (simple sheets)

```tsx
<Sheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Options"
  footer={<Button onClick={handleConfirm}>Confirm</Button>}
>
  <RadioGroup options={options} />
</Sheet>
```

### Composition API (custom layouts)

```tsx
<Sheet isOpen={isOpen} onClose={onClose}>
  <Sheet.Header>
    <Flex align="center" gap={2}>
      <Icon name="settings" />
      <Text variant="h4">Advanced Options</Text>
    </Flex>
  </Sheet.Header>
  <Sheet.Body>
    <Stack gap={4}>{/* Custom content */}</Stack>
  </Sheet.Body>
  <Sheet.Footer>
    <Button variant="ghost" onClick={onClose}>
      Cancel
    </Button>
    <Button onClick={handleSave}>Apply</Button>
  </Sheet.Footer>
</Sheet>
```

## Sub-components

| Component      | Description             |
| -------------- | ----------------------- |
| `Sheet.Header` | Header with drag handle |
| `Sheet.Body`   | Scrollable content area |
| `Sheet.Footer` | Action buttons area     |

## Guidelines

- Use for bottom sheets on mobile or compact overlays.
- Supports drag-to-dismiss gesture (drag down 150px+ to close).
- Closes on Escape key and overlay click.
- Use `variant="solid"` for high-emphasis content.
- Use composition API when you need custom header content.
