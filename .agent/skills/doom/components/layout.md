# Layout Components

## Import

```tsx
import { Flex, Stack, Grid, Container, Switcher } from "doom-design-system";
```

## Components

### Flex

One-dimensional flexbox container.

| Prop        | Type                                                                          | Default        | Description          |
| ----------- | ----------------------------------------------------------------------------- | -------------- | -------------------- |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"`                      | `"row"`        | Flex direction       |
| `justify`   | `"flex-start" \| "flex-end" \| "center" \| "space-between" \| "space-around"` | `"flex-start"` | Main axis alignment  |
| `align`     | `"flex-start" \| "flex-end" \| "center" \| "stretch" \| "baseline"`           | `"stretch"`    | Cross axis alignment |
| `gap`       | `0-16`                                                                        | `0`            | Spacing token        |
| `wrap`      | `boolean \| "wrap" \| "nowrap"`                                               | `false`        | Wrap behavior        |

### Stack

Vertical (or horizontal) stacking. Shorthand for Flex with `direction="column"`.

| Prop        | Default    | Description             |
| ----------- | ---------- | ----------------------- |
| `gap`       | `4`        | Default vertical gap    |
| `direction` | `"column"` | Can override to `"row"` |

### Grid

Two-dimensional grid container.

| Prop      | Type               | Default | Description                             |
| --------- | ------------------ | ------- | --------------------------------------- |
| `columns` | `string \| number` | `"1fr"` | Grid columns (e.g., `3` or `"1fr 2fr"`) |
| `gap`     | `0-16`             | `4`     | Spacing token                           |

### Container

Centered max-width container.

| Prop       | Type                                      | Default | Description          |
| ---------- | ----------------------------------------- | ------- | -------------------- |
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl" \| "fluid"` | `"xl"`  | Max width constraint |

### Switcher

Responsive flexbox that switches from row to column at breakpoint.

| Prop        | Type                            | Default | Description          |
| ----------- | ------------------------------- | ------- | -------------------- |
| `threshold` | `"xxs" \| "xs" \| "sm" \| "md"` | `"xs"`  | Breakpoint to switch |

## Usage

```tsx
<Stack gap={4}>
  <Text variant="h2">Title</Text>
  <Text>Description</Text>
</Stack>

<Flex justify="space-between" align="center">
  <Logo />
  <Nav />
</Flex>

<Grid columns={3} gap={4}>
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>

<Container maxWidth="lg">
  <PageContent />
</Container>

<Switcher threshold="sm">
  <Sidebar />
  <Main />
</Switcher>
```

## Guidelines

- Use `Stack` as your default vertical layout component.
- Use `Flex` for horizontal layouts or when you need fine control.
- Use `Grid` for two-dimensional layouts (cards, galleries).
- Use `Container` to constrain page content width.
- Use `Switcher` for responsive sidebar layouts.
