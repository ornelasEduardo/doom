# Textarea

## Import
```tsx
import { Textarea } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Label text |
| `error` | `string` | — | Error message — displayed in red below |
| `helperText` | `string` | — | Helper text below textarea |
| `showCount` | `boolean` | — | Show character count |
| `maxLength` | `number` | — | Max characters — auto-enables character counter |

Extends all standard `<textarea>` HTML attributes.

## Usage

```tsx
// Basic textarea
<Textarea label="Description" placeholder="Enter description..." rows={4} />

// With character limit
<Textarea label="Bio" maxLength={500} helperText="Brief description of yourself" />

// With error
<Textarea label="Notes" error="This field is required" />
```

## Notes
- Same API pattern as `Input` — `label`, `error`, `helperText`, `maxLength`, `showCount` behave identically
- Character count auto-shows when `maxLength` is set; `showCount` is redundant in that case
- Use `rows` attribute to control the initial rendered height
