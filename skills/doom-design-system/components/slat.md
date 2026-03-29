# Slat

## Import
```tsx
import { Slat } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `ReactNode` | required | Primary label |
| `secondaryLabel` | `ReactNode` | — | Secondary/supporting text |
| `prependContent` | `ReactNode` | — | Left slot (icon, thumbnail) |
| `appendContent` | `ReactNode` | — | Right slot (actions, badges) |
| `variant` | `"default" \| "danger" \| "success"` | `"default"` | Visual style |
| `onClick` | `(e: React.MouseEvent) => void` | — | Makes slat clickable |

## Usage

```tsx
// File list item
<Slat
  label="document.pdf"
  secondaryLabel="2.4 MB"
  prependContent={<FileIcon />}
  appendContent={
    <Button size="sm" variant="danger"><X size={16} /></Button>
  }
/>

// Clickable navigation row
<Slat
  label="Settings"
  prependContent={<Settings size={20} />}
  onClick={() => navigate("/settings")}
/>
```

## Notes
- When `onClick` is provided, the slat becomes focusable and keyboard-accessible
- Used internally by `FileUpload` for its file list — do not re-implement manually
- `variant="danger"` applies red styling to signal destructive/error states
