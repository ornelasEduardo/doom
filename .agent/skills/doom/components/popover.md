# Popover Component

## Import

```tsx
import { Popover } from "doom-design-system";
```

## Props

| Prop        | Type                                                                                            | Default          | Description                   |
| ----------- | ----------------------------------------------------------------------------------------------- | ---------------- | ----------------------------- |
| `trigger`   | `ReactNode`                                                                                     | required         | Element that triggers popover |
| `content`   | `ReactNode`                                                                                     | required         | Popover content               |
| `isOpen`    | `boolean`                                                                                       | required         | Controlled open state         |
| `onClose`   | `() => void`                                                                                    | required         | Close callback                |
| `placement` | `"bottom-start" \| "bottom-end" \| "bottom-center" \| "top-start" \| "top-end" \| "top-center"` | `"bottom-start"` | Position                      |
| `offset`    | `number`                                                                                        | `8`              | Distance from trigger         |

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
/>;
```

## Guidelines

- Used as the foundation for Dropdown, Select, Tooltip, etc.
- Automatically repositions to stay in viewport.
- Closes on click outside.
- You manage open state externally (controlled component).
