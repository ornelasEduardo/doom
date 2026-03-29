# Breadcrumbs

## Import
```tsx
import { Breadcrumbs, BreadcrumbItem } from "doom-design-system";
```

## Props

### Breadcrumbs

Extends all standard `<nav>` HTML attributes.

### BreadcrumbItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | — | Link destination (omit for current page item) |
| `isCurrent` | `boolean` | — | Marks item as current page — renders as text, not a link |
| `children` | `ReactNode` | required | Item label |

## Usage

```tsx
// Standard breadcrumb trail
<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/products">Products</BreadcrumbItem>
  <BreadcrumbItem isCurrent>Widget Pro</BreadcrumbItem>
</Breadcrumbs>
```

## Notes
- Last item should always use `isCurrent` — it renders as non-interactive text
- Separators between items are rendered automatically; do not add them manually
- `href` on the current item is ignored when `isCurrent` is set
