# SplitButton

## Import
```tsx
import { SplitButton } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `primaryLabel` | `string` | required | Main button text |
| `onPrimaryClick` | `() => void` | required | Main button click handler |
| `items` | `{ label: string; onClick: () => void }[]` | required | Dropdown menu items |
| `variant` | `"primary" \| "secondary"` | `"primary"` | Button style |

## Usage

```tsx
<SplitButton
  primaryLabel="Save"
  onPrimaryClick={handleSave}
  items={[
    { label: "Save as Draft", onClick: handleSaveDraft },
    { label: "Save and Publish", onClick: handleSavePublish },
  ]}
/>
```

## Notes
- Primary action button is on the left; dropdown toggle is on the right
- Use when there is one clear primary action with closely related secondary actions
- For a menu with no designated primary action, use `Dropdown` instead
