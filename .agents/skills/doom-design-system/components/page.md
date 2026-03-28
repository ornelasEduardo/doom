# Page

## Import
```tsx
import { Page } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "fullWidth"` | `"default"` | Layout variant |
| `children` | `ReactNode` | required | Page content |
| `className` | `string` | — | Additional CSS class |
| `style` | `React.CSSProperties` | — | Inline styles |

## Usage

```tsx
// Standard constrained page (65vw max-width)
<Page>
  <Text variant="h1">Dashboard</Text>
  <Stack gap={4}>
    {/* content */}
  </Stack>
</Page>

// Full-width page
<Page variant="fullWidth">
  <FullWidthHero />
  <Container>
    <MainContent />
  </Container>
</Page>
```

## Variants

| Variant | Use case |
|---------|----------|
| `default` | Standard content pages — constrained to 65vw with padding |
| `fullWidth` | Landing pages, dashboards, map/canvas views — 100% width, no padding |

## Notes
- Renders as a `<main>` element — only one `Page` per route for correct semantics
- `variant="fullWidth"` has no default padding; add `Container` inside for scoped width control
- Does not include scroll management — wrap in a scroll container if needed
