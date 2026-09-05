# Link

## Import
```tsx
import { Link } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "button" \| "subtle"` | `"default"` | Visual style |
| `isExternal` | `boolean` | — | Defaults to `target="_blank"`; shows an external-link icon |
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
- An explicit `target` overrides the `isExternal` default, including `target="_self"` or an empty target.
- Whenever the effective target is `_blank` (case-insensitive), Link merges `noopener noreferrer` into `rel`, preserving unrelated tokens and removing duplicate tokens case-insensitively while preserving the first spelling. This also applies when setting `target="_blank"` without `isExternal`.
- For other targets, `rel` is passed through unchanged.
- `isExternal` auto-renders an `ExternalLink` icon (from Lucide).
- `disabled` prevents navigation and sets `aria-disabled`, but does not remove the element from tab order
