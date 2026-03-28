# Card

## Import
```tsx
import { Card } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `ElementType` | `"div"` | HTML element to render |
| `children` | `ReactNode` | required | Card content |
| `className` | `string` | — | Additional CSS classes |

Extends all standard `<div>` HTML attributes.

## Usage

```tsx
// Basic card
<Card>
  <Text variant="h4">Card Title</Text>
  <Text>Card content goes here.</Text>
</Card>

// Semantic card
<Card as="article">
  <Text variant="h3">Article Heading</Text>
</Card>
```

## Notes
- Card has no built-in padding — add your own with Layout components or CSS
- Provides background (`--card-bg`), border (`--card-border`), and hard shadow (`--shadow-hard`)
- Use `as="article"` or `as="section"` for semantic HTML
