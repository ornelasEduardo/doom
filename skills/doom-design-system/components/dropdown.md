# Dropdown

## Import
```tsx
import { Dropdown } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `triggerLabel` | `string` | required | Button text |
| `items` | `{ label: string; onClick: () => void }[]` | required | Menu items |
| `variant` | `"primary" \| "secondary"` | `"primary"` | Button style |

## Usage

```tsx
<Dropdown
  triggerLabel="Actions"
  items={[
    { label: "Edit", onClick: handleEdit },
    { label: "Delete", onClick: handleDelete },
  ]}
/>

// Secondary style
<Dropdown
  triggerLabel="More"
  variant="secondary"
  items={[{ label: "Export", onClick: handleExport }]}
/>
```

## Notes
- Menu closes automatically after an item is clicked
- For split primary/secondary actions, use `SplitButton` instead
- Built on top of `Popover` internally
