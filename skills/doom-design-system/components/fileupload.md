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
| `errorMessage` | `string` | — | Error message text |
| `required` | `boolean` | `false` | Mark field as required |
| `showPreview` | `boolean` | `false` | Show image thumbnails for image files |
| `onChange` | `(files: File[]) => void` | — | Called when file list changes |

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
- Supports both drag-and-drop and click-to-browse
- `showPreview` only renders thumbnails for image MIME types — non-image files show a generic icon
- Files can be individually removed via the X button; `onChange` is called on each removal
- `maxSize` validation shows an error message automatically — set `errorMessage` to customize it
