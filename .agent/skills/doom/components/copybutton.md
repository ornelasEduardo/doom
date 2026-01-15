# CopyButton Component

## Import

```tsx
import { CopyButton } from "doom-design-system";
```

## Props

| Prop         | Type           | Default       | Description              |
| ------------ | -------------- | ------------- | ------------------------ |
| `value`      | `string`       | **required**  | Text to copy             |
| `variant`    | Button variant | `"secondary"` | Visual style             |
| `size`       | Button size    | `"md"`        | Button size              |
| `copiedText` | `string`       | `"Copied!"`   | Text shown after copy    |
| `resetDelay` | `number`       | `2000`        | Ms before reset to orig. |

Plus all standard `<button>` HTML attributes.

## Usage

```tsx
<CopyButton value={textToCopy}>Copy</CopyButton>

<CopyButton value={code} variant="ghost" size="sm">
  Copy Code
</CopyButton>

<CopyButton copiedText="Done!" value={referenceDoc}>
  Copy Reference
</CopyButton>
```

## Behavior

- **Tactile Pop Animation**: Press effect on click, springy scale-in for success state
- Text changes to `copiedText` (default: "Copied!")
- Button width preserved (doesn't jump)
- Auto-resets after `resetDelay` ms (default 2s)
- Variant stays the same (no jarring color change)
