# Card Component

## Import

```tsx
import { Card } from "doom-design-system";
```

## Props

| Prop        | Type          | Default  | Description            |
| ----------- | ------------- | -------- | ---------------------- |
| `as`        | `ElementType` | `"div"`  | HTML element to render |
| `children`  | `ReactNode`   | required | Card content           |
| `className` | `string`      | —        | Additional classes     |

Plus all standard HTML attributes for the rendered element.

## Usage

```tsx
<Card>
  <Text variant="h4">Card Title</Text>
  <Text>Card content goes here.</Text>
</Card>
```

## Styling

Card provides:

- Background: `var(--card-bg)`
- Border: `var(--border-width) solid var(--card-border)`
- Shadow: `var(--shadow-hard)`
- Padding: Inherited from component (add your own)

## Guidelines

- Card is a generic container—use it to group related content.
- Cards do not have built-in padding; add your own with Layout components or SCSS.
- Use `as="article"` or `as="section"` for semantic HTML when appropriate.
