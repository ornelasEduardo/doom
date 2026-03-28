# Popover

## Import
```tsx
import { Popover } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | `ReactNode` | required | Element that opens the popover |
| `content` | `ReactNode` | required | Popover content |
| `isOpen` | `boolean` | required | Controlled open state |
| `onClose` | `() => void` | required | Close callback |
| `placement` | `"bottom-start" \| "bottom-end" \| "bottom-center" \| "top-start" \| "top-end" \| "top-center"` | `"bottom-start"` | Position relative to trigger |
| `offset` | `number` | `8` | Distance from trigger in px |

## Usage

```tsx
const [isOpen, setIsOpen] = useState(false);

<Popover
  trigger={<Button onClick={() => setIsOpen(true)}>Open Menu</Button>}
  content={
    <Card>
      <Stack gap={2}>
        <Button variant="ghost">Option 1</Button>
        <Button variant="ghost">Option 2</Button>
      </Stack>
    </Card>
  }
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
```

## Notes
- Fully controlled — you manage open state externally
- Automatically repositions to stay within viewport bounds
- Closes on click outside the popover content
- Used as the base for `Dropdown`, `Select`, `Tooltip`, and `Combobox` internally
