# Popover

## Import

```tsx
import { Popover } from "doom-design-system";
```

## Props

| Prop        | Type                                                                                            | Default          | Description                    |
| ----------- | ----------------------------------------------------------------------------------------------- | ---------------- | ------------------------------ |
| `trigger`   | `ReactNode`                                                                                     | required         | Element that opens the popover |
| `content`   | `ReactNode`                                                                                     | required         | Popover content                |
| `isOpen`    | `boolean`                                                                                       | required         | Controlled open state          |
| `onClose`   | `() => void`                                                                                    | required         | Close callback                 |
| `placement` | `"bottom-start" \| "bottom-end" \| "bottom-center" \| "top-start" \| "top-end" \| "top-center"` | `"bottom-start"` | Position relative to trigger   |
| `offset`    | `number`                                                                                        | `8`              | Distance from trigger in px    |

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

## Notes

- Fully controlled — you manage open state externally
- Automatically repositions to stay within viewport bounds
- Closes on click outside the popover content
- Used as the base for `Dropdown`, `Select`, `Tooltip`, and `Combobox` internally

## Theme parts

For public parts, registered sizes and variants, see the [Popover theme contract](../../../THEME-REFERENCE.md#component-popover).

### Dismissal and presence

Escape dismisses the innermost Popover and returns focus to its trigger. Closed content becomes inert immediately; its opacity transition may finish before removal. Reopening cancels pending removal. Reduced motion and browsers without animation inspection remove content immediately. Nested Popovers stay inside the owning overlay's portal host.

For action menus, use the exported `useMenu()` hook. Attach `triggerRef` to the trigger or its wrapper, spread `triggerProps` on its button, attach `menuRef` and `menuProps` to the menu, and give enabled actions `role="menuitem"` and `tabIndex={-1}`. Call `close(true)` before activating an action. The hook supplies pointer/keyboard entry, Arrow/Home/End navigation, typeahead, Escape return, Tab exit and outside-focus dismissal. Dropdown and SplitButton use this contract and support `disabled` on the control and individual items.
