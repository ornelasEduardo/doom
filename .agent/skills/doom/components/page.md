# Page Component

## Import

```tsx
import { Page } from "doom-design-system";
```

## Props

| Prop       | Type                       | Default     | Description    |
| ---------- | -------------------------- | ----------- | -------------- |
| `variant`  | `"default" \| "fullWidth"` | `"default"` | Layout variant |
| `children` | `ReactNode`                | required    | Page content   |

## Usage

```tsx
// Standard constrained page
<Page>
  <Text variant="h1">Dashboard</Text>
  <Stack gap={4}>
    {/* Page content */}
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

## Guidelines

- `variant="default"`: 65vw max-width with standard padding.
- `variant="fullWidth"`: 100% width, no default padding.
- Renders as `<main>` element for semantic HTML.
- Use with `Container` for more control over content width.
