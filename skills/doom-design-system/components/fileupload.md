# FileUpload

## Import
```tsx
import { FileUpload } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Upload area label |
| `helperText` | `string` | — | Helper text below upload area |
| `accept` | `string` | — | Accepted file types (e.g., `"image/*"`, `".pdf,.doc"`) |
| `maxSize` | `number` | — | Max file size in bytes |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `defaultFiles` | `File[]` | `[]` | Initial files (uncontrolled) |
| `disabled` | `boolean` | `false` | Disabled state |
| `error` | `boolean` | `false` | Error state |
| `errorMessage` | `string` | — | Error message text (overrides auto-generated validation errors) |
| `required` | `boolean` | `false` | Mark field as required |
| `showPreview` | `boolean` | `false` | Show image thumbnails for image files |
| `onChange` | `(files: File[]) => void` | — | Called when file list changes |
| `forceActive` | `boolean` | `false` | Force active/void state (debugging) |
| `className` | `string` | — | CSS class name |

## File Type Icons

Non-image files display type-specific icons based on extension:

| Icon | Extensions |
|------|-----------|
| Image | jpg, jpeg, png, gif, svg, webp |
| Video | mp4, mov, avi, mkv, webm, flv |
| Audio | mp3, wav, ogg, m4a, flac |
| Code | js, ts, jsx, tsx, html, css, json, py, java, cpp, c, go |
| Archive | zip, rar, 7z, tar, gz |
| Spreadsheet | xls, xlsx, csv, ods |
| Text | pdf |
| Generic | all other extensions |

## Internal Status States

The component uses an internal state machine that drives visual styling:

| Status | Condition |
|--------|-----------|
| `Disabled` | `disabled` prop is true |
| `Error` | Error message exists |
| `Void` | Dragging/active/forceActive and no files (animated star field) |
| `HasFiles` | Files are present |
| `Idle` | Default state |

## Usage

```tsx
// Document upload with size limit
<FileUpload
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  maxSize={5 * 1024 * 1024}
  multiple
  onChange={setFiles}
/>

// Image upload with preview
<FileUpload
  label="Profile Photo"
  accept="image/*"
  showPreview
/>
```

## Notes
- Supports drag-and-drop and click-to-browse, plus keyboard activation (Enter/Space)
- `showPreview` only renders thumbnails for image MIME types — non-images show type-specific icons
- Files can be individually removed via the X button; `onChange` is called on each removal
- `maxSize` validation auto-generates error: `"File "{name}" exceeds maximum size of {formatted}"` — set `errorMessage` to override
- In `multiple` mode with existing files, an "Upload More Files" button appears to add without removing
- File sizes are auto-formatted (Bytes, KB, MB, GB) in the file list
- Image preview object URLs are properly cleaned up on removal and unmount (no memory leaks)
- Error priority: prop `errorMessage` takes precedence over auto-generated validation errors
- ARIA: `aria-describedby`, `aria-invalid`, `aria-required`, `aria-live="polite"` on status badge
