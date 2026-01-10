# SplitButton Component

## Import

```tsx
import { SplitButton } from "doom-design-system";
```

## Props

| Prop             | Type                                       | Default     | Description               |
| ---------------- | ------------------------------------------ | ----------- | ------------------------- |
| `primaryLabel`   | `string`                                   | required    | Main button text          |
| `onPrimaryClick` | `() => void`                               | required    | Main button click handler |
| `items`          | `{ label: string, onClick: () => void }[]` | required    | Dropdown items            |
| `variant`        | `"primary" \| "secondary"`                 | `"primary"` | Button style              |

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

## Guidelines

- Use when there's a primary action with related secondary actions.
- Primary button on left, dropdown trigger on right.
- For simple menus without primary action, use `Dropdown` instead.
