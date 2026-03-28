# Layout

## Import
```tsx
import { Flex, Stack, Grid, Container, Switcher } from "doom-design-system";
```

## Props

### Flex

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | `"row"` | Flex direction |
| `justify` | `"flex-start" \| "flex-end" \| "center" \| "space-between" \| "space-around" \| "space-evenly"` | `"flex-start"` | Main axis alignment |
| `align` | `"flex-start" \| "flex-end" \| "center" \| "stretch" \| "baseline"` | `"stretch"` | Cross axis alignment |
| `gap` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8 \| 10 \| 12 \| 16` | `0` | Spacing token |
| `wrap` | `boolean \| "wrap" \| "nowrap" \| "wrap-reverse"` | `false` | Wrap behavior |

Extends all standard `<div>` HTML attributes.

### Stack

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `direction` | `"column" \| "column-reverse" \| "row" \| "row-reverse"` | `"column"` | Stack direction |
| `gap` | `Spacing` | `4` | Default vertical gap |
| `align` | `string` | `"stretch"` | Cross axis alignment |

Extends all standard `<div>` HTML attributes.

### Grid

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `string \| number` | `"1fr"` | Grid columns — number creates equal columns, string is raw CSS |
| `gap` | `Spacing` | `4` | Spacing token |

Extends all standard `<div>` HTML attributes.

### Container

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl" \| "fluid"` | `"xl"` | Max width: sm=640px, md=768px, lg=1024px, xl=1280px, fluid=100% |

Extends all standard `<div>` HTML attributes.

### Switcher

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `threshold` | `"xxs" \| "xs" \| "sm" \| "md"` | `"xs"` | Breakpoint at which layout switches from row to column |

Extends all standard `<div>` HTML attributes.

## Usage

```tsx
// Vertical stack with consistent spacing
<Stack gap={4}>
  <Text variant="h2">Title</Text>
  <Text>Description</Text>
</Stack>

// Horizontal flex with space-between
<Flex justify="space-between" align="center">
  <Logo />
  <Nav />
</Flex>

// 3-column equal grid
<Grid columns={3} gap={4}>
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>

// Constrained page width
<Container maxWidth="lg">
  <PageContent />
</Container>

// Sidebar + main that stacks on small screens
<Switcher threshold="sm">
  <Sidebar />
  <Main />
</Switcher>
```

## Notes
- `Stack` is `Flex` with `direction="column"` and `gap=4` as defaults — prefer it for vertical layouts
- `Grid columns={3}` compiles to `repeat(3, 1fr)`; pass a CSS string like `"200px 1fr"` for unequal columns
- `Container` centers horizontally via `margin: auto` — it does not control vertical spacing
- `Switcher` uses container queries or breakpoints; each child gets equal width in row mode
