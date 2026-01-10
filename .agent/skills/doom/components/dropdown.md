# Dropdown Component

## Import

```tsx
import { Dropdown } from "doom-design-system";
```

## Props

| Prop           | Type                                       | Default     | Description  |
| -------------- | ------------------------------------------ | ----------- | ------------ |
| `triggerLabel` | `string`                                   | required    | Button text  |
| `items`        | `{ label: string, onClick: () => void }[]` | required    | Menu items   |
| `variant`      | `"primary" \| "secondary"`                 | `"primary"` | Button style |

## Usage

```tsx
<Dropdown
  triggerLabel="Actions"
  items={[
    { label: "Edit", onClick: handleEdit },
    { label: "Delete", onClick: handleDelete },
  ]}
/>
```

## Guidelines

- Use for action menus or overflow menus.
- For split primary/secondary actions, use `SplitButton` instead.
- Menu closes automatically after item click.
