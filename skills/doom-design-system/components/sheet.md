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
| `className` | `string` | — | CSS class name |

### Subcomponents

| Component | Props | Description |
|-----------|-------|-------------|
| `Sheet.Header` | `children`, `className?` | Header with visible drag handle bar and close button |
| `Sheet.Body` | `children`, `className?` | Scrollable content area |
| `Sheet.Footer` | `children`, `className?` | Action buttons area |

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
- Slides up from bottom; fixed height of 85vh
- **Drag-to-dismiss**: drag the header down 150px+ to close; transitions disabled during drag, snap-back on incomplete gesture
- Header renders a visible drag handle bar (12px wide, pill-shaped); opacity adjusts in solid variant
- Closes on Escape key and overlay click automatically
- Renders via portal to `document.body`; locks body scroll when open
- Use for bottom sheets on mobile or compact overlays
- `variant="solid"` for high-emphasis content
