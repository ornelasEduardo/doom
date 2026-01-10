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
| `title`    | `string`               | —           | Header title        |
| `children` | `ReactNode`            | required    | Sheet content       |
| `footer`   | `ReactNode`            | —           | Footer content      |
| `variant`  | `"default" \| "solid"` | `"default"` | Visual style        |

## Usage

```tsx
<Sheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filters"
  footer={
    <Flex gap={2}>
      <Button variant="ghost" onClick={reset}>
        Reset
      </Button>
      <Button onClick={apply}>Apply</Button>
    </Flex>
  }
>
  <Stack gap={4}>{/* Filter controls */}</Stack>
</Sheet>
```

## Guidelines

- Slides up from bottom of screen (mobile-friendly).
- Supports drag-to-dismiss gesture (swipe down to close).
- Closes on Escape key and overlay click.
- Use for mobile-first overlays, filters, or action sheets.
- For side panels, use `Drawer` instead.
