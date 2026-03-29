# CopyButton

## Import
```tsx
import { CopyButton } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Button label text |
| `value` | `string` | required | Text to copy to clipboard |
| `variant` | `"primary" \| "secondary" \| "ghost" \| "outline" \| "success" \| "danger"` | `"secondary"` | Visual style (same as Button) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size (same as Button) |
| `copiedText` | `string` | `"Copied!"` | Text displayed after successful copy |
| `resetDelay` | `number` | `2000` | Milliseconds before button resets to original state |

Extends all standard `<button>` HTML attributes.

## Usage

```tsx
// Basic copy button
<CopyButton value={textToCopy}>Copy</CopyButton>

// Ghost variant for code blocks
<CopyButton value={code} variant="ghost" size="sm">
  Copy Code
</CopyButton>

// Custom copied feedback text
<CopyButton copiedText="Done!" value={referenceDoc}>
  Copy Reference
</CopyButton>
```

## Notes
- Button width is preserved during the copied state — no layout jump
- Variant and size remain unchanged in copied state — no jarring color change
- Auto-resets after `resetDelay` ms; the default 2s is sufficient for most cases
