# Text Component

## Import

```tsx
import { Text } from "doom-design-system";
```

## Props

| Prop      | Type                                                                             | Default  | Description            |
| --------- | -------------------------------------------------------------------------------- | -------- | ---------------------- |
| `variant` | `"h1" \| "h2" \| "h3" \| "h4" \| "h5" \| "h6" \| "body" \| "small" \| "caption"` | `"body"` | Typography style       |
| `weight`  | `"normal" \| "medium" \| "semibold" \| "bold" \| "black"`                        | —        | Font weight override   |
| `color`   | `"primary" \| "secondary" \| "muted" \| "error" \| "success" \| "warning"`       | —        | Text color             |
| `align`   | `"left" \| "center" \| "right"`                                                  | —        | Text alignment         |
| `as`      | `ElementType`                                                                    | auto     | HTML element to render |

## Usage

```tsx
<Text variant="h1">Page Title</Text>

<Text variant="body">
  Regular paragraph text.
</Text>

<Text variant="small" color="muted">
  Helper text or captions.
</Text>

<Text as="label" htmlFor="input" weight="semibold">
  Form Label
</Text>
```

## Guidelines

- Use semantic variants (`h1`-`h6` auto-render as heading elements).
- Use `as` prop to override the HTML element when needed.
- Heading variants use the design system's heading font.
- Body/small/caption use the body font.
