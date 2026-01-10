# FileUpload Component

## Import

```tsx
import { FileUpload } from "doom-design-system";
```

## Props

| Prop           | Type                      | Default | Description                             |
| -------------- | ------------------------- | ------- | --------------------------------------- |
| `label`        | `string`                  | —       | Upload area label                       |
| `helperText`   | `string`                  | —       | Helper text                             |
| `accept`       | `string`                  | —       | Accepted file types (e.g., `"image/*"`) |
| `maxSize`      | `number`                  | —       | Max file size in bytes                  |
| `multiple`     | `boolean`                 | `false` | Allow multiple files                    |
| `defaultFiles` | `File[]`                  | `[]`    | Initial files                           |
| `disabled`     | `boolean`                 | `false` | Disabled state                          |
| `error`        | `boolean`                 | `false` | Error state                             |
| `errorMessage` | `string`                  | —       | Error message                           |
| `required`     | `boolean`                 | `false` | Required field                          |
| `showPreview`  | `boolean`                 | `false` | Show image thumbnails                   |
| `onChange`     | `(files: File[]) => void` | —       | Change callback                         |

## Usage

```tsx
<FileUpload
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  maxSize={5 * 1024 * 1024} // 5MB
  multiple
  onChange={setFiles}
/>

<FileUpload
  label="Profile Photo"
  accept="image/*"
  showPreview
/>
```

## Guidelines

- Supports drag-and-drop and click-to-browse.
- `showPreview` displays image thumbnails for image files.
- Files can be removed individually via the X button.
- File size validation with clear error messages.
