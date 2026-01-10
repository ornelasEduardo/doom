# Toast Component

## Import

```tsx
import { ToastProvider, useToast } from "doom-design-system";
```

## Setup

Wrap your app with `ToastProvider`:

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

## Hook

```tsx
const { toast, toastSuccess, toastError, toastWarning, toastInfo } = useToast();
```

## Usage

```tsx
function MyComponent() {
  const { toastSuccess, toastError } = useToast();

  const handleSave = async () => {
    try {
      await save();
      toastSuccess("Changes saved!");
    } catch (error) {
      toastError("Failed to save changes");
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

## Methods

| Method                  | Description                      |
| ----------------------- | -------------------------------- |
| `toast(message, type?)` | Generic toast with optional type |
| `toastSuccess(message)` | Green success toast              |
| `toastError(message)`   | Red error toast                  |
| `toastWarning(message)` | Yellow warning toast             |
| `toastInfo(message)`    | Blue info toast                  |

## Guidelines

- Auto-dismisses after 5 seconds.
- Can be manually dismissed via X button.
- Toasts stack from bottom-right.
- Use for non-blocking notifications.
