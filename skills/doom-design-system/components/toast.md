# Toast

## Import
```tsx
import { ToastProvider, useToast } from "doom-design-system";
```

## Setup

Wrap your app root with `ToastProvider` once:

```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

## toast() API

```tsx
const { toast, toastSuccess, toastError, toastWarning, toastInfo } = useToast();
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `toast()` | `toast(message: string, type?: "success" \| "error" \| "warning" \| "info") => void` | Generic toast with optional type (default: `"info"`) |
| `toastSuccess()` | `toastSuccess(message: string) => void` | Green success toast |
| `toastError()` | `toastError(message: string) => void` | Red error toast |
| `toastWarning()` | `toastWarning(message: string) => void` | Yellow warning toast |
| `toastInfo()` | `toastInfo(message: string) => void` | Blue info toast |

## Usage

```tsx
function MyComponent() {
  const { toastSuccess, toastError } = useToast();

  const handleSave = async () => {
    try {
      await save();
      toastSuccess("Changes saved!");
    } catch {
      toastError("Failed to save changes");
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

## Notes
- `ToastProvider` must be an ancestor — `useToast()` throws if used outside it
- Toasts auto-dismiss after 5 seconds (hardcoded, not configurable)
- Users can manually dismiss via the X button
- Toasts stack from the bottom-right of the screen
