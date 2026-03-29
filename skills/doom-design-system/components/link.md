# Link

## Import
```tsx
import { Link } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "button" \| "subtle"` | `"default"` | Visual style |
| `isExternal` | `boolean` | — | Opens in new tab; auto-adds `target="_blank"` and `rel="noopener noreferrer"` |
| `disabled` | `boolean` | — | Disabled state |
| `prefetch` | `boolean` | — | Prefetch on hover |

Extends all standard `<a>` HTML attributes.

## Usage

```tsx
// Inline text link
<Link href="/about">About Us</Link>

// External link with icon
<Link href="https://github.com" isExternal>
  GitHub
</Link>

// Link styled as a button
<Link href="/docs" variant="button">
  View Documentation
</Link>

// Low-emphasis link
<Link href="/help" variant="subtle">
  Need help?
</Link>
```

## Variants

| Variant | Use case |
|---------|----------|
| `default` | Standard inline text link |
| `button` | Link that visually looks like a Button — use for CTA navigation |
| `subtle` | Low-emphasis link in dense UI or footers |

## Notes
- `isExternal` handles all security attributes automatically — do not manually set `rel`
- `disabled` prevents navigation but does not remove the element from tab order; consider `aria-disabled` for full accessibility
