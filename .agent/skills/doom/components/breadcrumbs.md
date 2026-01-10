# Breadcrumbs Component

## Import

```tsx
import { Breadcrumbs, BreadcrumbItem } from "doom-design-system";
```

## Props

### BreadcrumbItem

| Prop        | Type        | Description          |
| ----------- | ----------- | -------------------- |
| `href`      | `string`    | Link destination     |
| `isCurrent` | `boolean`   | Mark as current page |
| `children`  | `ReactNode` | Link text            |

## Usage

```tsx
<Breadcrumbs>
  <BreadcrumbItem href="/">Home</BreadcrumbItem>
  <BreadcrumbItem href="/products">Products</BreadcrumbItem>
  <BreadcrumbItem isCurrent>Widget Pro</BreadcrumbItem>
</Breadcrumbs>
```

## Guidelines

- Last item should have `isCurrent` (no link, shows as text).
- Separators are automatically rendered between items.
- Use for navigation hierarchy in multi-level pages.
