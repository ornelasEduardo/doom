# Sheet

## Import
```tsx
import { Sheet } from "doom-design-system";
```

## Props

### Sheet (root)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Close callback |
| `title` | `ReactNode` | — | Header title (shorthand API) |
| `footer` | `ReactNode` | — | Footer content (shorthand API) |
| `variant` | `"default" \| "solid"` | `"default"` | Visual style |
| `children` | `ReactNode` | required | Sheet content |

### Sub-component Props

| Component | Props | Description |
|-----------|-------|-------------|
| `Sheet.Header` | `children: ReactNode` | Header area with drag handle |
| `Sheet.Body` | `children: ReactNode` | Scrollable content area |
| `Sheet.Footer` | `children: ReactNode` | Action buttons area |

## Usage

```tsx
// Shorthand API
<Sheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Options"
  footer={<Button onClick={handleConfirm}>Confirm</Button>}
>
  <RadioGroup options={options} />
</Sheet>

// Composition API — custom header
<Sheet isOpen={isOpen} onClose={onClose}>
  <Sheet.Header>
    <Flex align="center" gap={2}>
      <Icon name="settings" />
      <Text variant="h4">Advanced Options</Text>
    </Flex>
  </Sheet.Header>
  <Sheet.Body>
    <Stack gap={4}>{/* Content */}</Stack>
  </Sheet.Body>
  <Sheet.Footer>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button onClick={handleSave}>Apply</Button>
  </Sheet.Footer>
</Sheet>
```

## Notes
- Supports drag-to-dismiss gesture — drag down 150px+ to close
- Closes on Escape key and overlay click automatically
- Use for bottom sheets on mobile or compact overlays
- `variant="solid"` for high-emphasis content
- Use composition API when you need custom header content
