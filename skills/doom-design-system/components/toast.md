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

## Accessibility

- The provider mounts empty, visually hidden `status` (polite) and `alert` (assertive) regions before inserting announcement text, following [W3C ARIA22](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html).
- Errors go to the alert region; success, warning, info, and default messages go to the status region. Both regions are atomic and contain only the latest announcement batch.
- Polite and assertive announcements schedule independently. Each channel clears only when a new message arrives and inserts after a fixed 100ms window; messages arriving within that window are combined in arrival order without extending the delay. Repeated text produces a genuine content change, and old visible toasts are not reannounced.
- Each region retains its last announcement until replacement. Errors never wait for polite messages.
- Visible notifications are named groups outside the live regions; their text and close buttons remain accessible without nested or duplicate live-region semantics.
- Automated unit and Chromium tests verify DOM changes and real-click dismissal. Native screen-reader speech and timing require manual assistive-technology testing.
- The X button has the accessible name `Close notification` and retains native button keyboard behavior.

## Notes
- `ToastProvider` must be an ancestor — `useToast()` throws if used outside it
- Toasts auto-dismiss after 5 seconds (hardcoded, not configurable)
- Users can manually dismiss via the X button
- Toasts stack from the bottom-right of the screen
