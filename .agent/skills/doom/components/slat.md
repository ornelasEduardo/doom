# Slat Component

## Import

```tsx
import { Slat } from "doom-design-system";
```

## Props

| Prop             | Type                                 | Default     | Description                    |
| ---------------- | ------------------------------------ | ----------- | ------------------------------ |
| `label`          | `ReactNode`                          | required    | Primary label                  |
| `secondaryLabel` | `ReactNode`                          | —           | Secondary text                 |
| `prependContent` | `ReactNode`                          | —           | Left content (icon, thumbnail) |
| `appendContent`  | `ReactNode`                          | —           | Right content (actions)        |
| `variant`        | `"default" \| "danger" \| "success"` | `"default"` | Visual style                   |
| `onClick`        | `() => void`                         | —           | Makes slat clickable           |

## Usage

```tsx
<Slat
  label="document.pdf"
  secondaryLabel="2.4 MB"
  prependContent={<FileIcon />}
  appendContent={
    <Button size="sm" variant="danger">
      <X size={16} />
    </Button>
  }
/>

// Clickable slat
<Slat
  label="Settings"
  prependContent={<Settings size={20} />}
  onClick={() => navigate("/settings")}
/>
```

## Guidelines

- Use for list items like file lists, settings, or navigation.
- Used internally by `FileUpload` for file list display.
- When `onClick` is provided, slat becomes focusable and keyboard accessible.
