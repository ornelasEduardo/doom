# Link Component

## Import

```tsx
import { Link } from "doom-design-system";
```

## Props

| Prop         | Type                                | Default     | Description                         |
| ------------ | ----------------------------------- | ----------- | ----------------------------------- |
| `variant`    | `"default" \| "button" \| "subtle"` | `"default"` | Visual style                        |
| `isExternal` | `boolean`                           | —           | Open in new tab, show external icon |
| `disabled`   | `boolean`                           | —           | Disabled state                      |
| `prefetch`   | `boolean`                           | —           | Prefetch on hover                   |

Plus all standard `<a>` attributes.

## Usage

```tsx
<Link href="/about">About Us</Link>

<Link href="https://github.com" isExternal>
  GitHub
</Link>

<Link href="/docs" variant="button">
  View Documentation
</Link>
```

## Guidelines

- Use `variant="default"` for inline text links.
- Use `variant="button"` for links that look like buttons.
- Use `variant="subtle"` for low-emphasis links.
- `isExternal` adds `target="_blank"` and rel attributes automatically.
