# A2UI Protocol Reference

## Message Schema

A2UI uses a flat adjacency list format where components reference children by ID.

### Component Structure

```json
{
  "surfaceId": "main",
  "components": [
    {
      "id": "unique-id",
      "component": {
        "component-type": {
          "propName": "value",
          "text": { "literalString": "Static text" },
          "children": { "explicitList": ["child-id-1", "child-id-2"] }
        }
      }
    }
  ]
}
```

### Value Types

| Type              | Format                       | Example                          |
| ----------------- | ---------------------------- | -------------------------------- |
| Literal String    | `{ "literalString": "..." }` | `{ "literalString": "Hello" }`   |
| Data Binding      | `{ "path": "/..." }`         | `{ "path": "/user/name" }`       |
| Single Child      | `"child-id"`                 | `"header-component"`             |
| Multiple Children | `{ "explicitList": [...] }`  | `{ "explicitList": ["a", "b"] }` |

---

## Text Content: IMPORTANT

**Not all components use `text` prop.** Only components marked with ✅ below support `text: { literalString }` or `text: { path }`:

| Supports `text` prop | Component         | Text Prop                      |
| :------------------: | ----------------- | ------------------------------ |
|          ✅          | `label`           | `text`                         |
|          ✅          | `text`            | `text` → maps to children      |
|          ✅          | `button`          | `text` → maps to children      |
|          ✅          | `badge`           | `text` → maps to children      |
|          ✅          | `chip`            | `text` → maps to children      |
|          ✅          | `link`            | `text` → maps to children      |
|          ✅          | `tabs-trigger`    | `text` → maps to children      |
|          ✅          | `breadcrumb-item` | `text` → maps to children      |
|          ❌          | `slat`            | Use `label` + `secondaryLabel` |
|          ❌          | `alert`           | Use `title` + `description`    |
|          ❌          | `input`           | Use `label` + `placeholder`    |
|          ❌          | `avatar`          | Use `fallback` for initials    |

### Common Mistakes

```json
// ❌ WRONG - slat doesn't support text prop
{ "slat": { "label": "Trips", "text": { "literalString": "4" } } }

// ✅ CORRECT - use secondaryLabel
{ "slat": { "label": "Trips", "secondaryLabel": "4" } }

// ❌ WRONG - alert doesn't support text prop
{ "alert": { "variant": "warning", "text": { "literalString": "Warning message" } } }

// ✅ CORRECT - use title and description
{ "alert": { "variant": "warning", "title": "Warning", "description": "Message details" } }
```

---

## Component Reference

### Primitives

| Type       | Key Props                            | Notes                          |
| ---------- | ------------------------------------ | ------------------------------ |
| `label`    | `text` ✅                            | Simple text label              |
| `text`     | `variant`, `text` ✅                 | Typography: h1-h6/body/small   |
| `button`   | `variant`, `text` ✅                 | primary/secondary/ghost/danger |
| `badge`    | `variant`, `text` ✅                 | Status indicator               |
| `chip`     | `variant`, `text` ✅                 | Tag element                    |
| `avatar`   | `src`, `fallback`, `size`            | User avatar                    |
| `alert`    | `title` ⚠️, `description`, `variant` | title is REQUIRED              |
| `card`     | `className`, `child`/`children`      | Container                      |
| `input`    | `label`, `placeholder`, `value`      | Text field                     |
| `textarea` | `label`, `placeholder`, `rows`       | Multi-line                     |
| `checkbox` | `label`, `checked`                   | Checkbox                       |
| `switch`   | `label`, `checked`                   | Toggle                         |
| `link`     | `href`, `text` ✅                    | Hyperlink                      |
| `spinner`  | `size`                               | Loading indicator              |

### Layout

| Type        | Key Props                                          |
| ----------- | -------------------------------------------------- |
| `flex`      | `direction`, `gap`, `align`, `justify`, `children` |
| `stack`     | `gap`, `children`                                  |
| `grid`      | `columns`, `gap`, `children`                       |
| `container` | `size`, `children`                                 |
| `box`       | `className`, `children`                            |

### Data Display

| Type             | Key Props                               | Notes                           |
| ---------------- | --------------------------------------- | ------------------------------- |
| `slat`           | `label` ⚠️, `secondaryLabel`, `variant` | label is REQUIRED, NO text prop |
| `table`          | `data`, `columns`                       | Each column needs `accessorKey` |
| `chart`          | `type`, `data`, `xKey`, `yKey`          | line/area/bar                   |
| `accordion`      | `type`, `defaultValue`, `children`      | single/multiple                 |
| `accordion-item` | `value`, `trigger`, `children`          |                                 |
| `image`          | `src`, `alt`                            |                                 |

### Navigation

| Type              | Key Props                   |
| ----------------- | --------------------------- |
| `tabs`            | `defaultValue`, `children`  |
| `tabs-list`       | `children`                  |
| `tabs-trigger`    | `value`, `text` ✅          |
| `tabs-body`       | `children`                  |
| `tabs-content`    | `value`, `child`/`children` |
| `breadcrumbs`     | `children`                  |
| `breadcrumb-item` | `href`, `text` ✅           |

### Feedback

| Type           | Key Props          |
| -------------- | ------------------ |
| `progress-bar` | `value`, `variant` |
| `skeleton`     | `width`, `height`  |

### Actions

| Type           | Key Props  |
| -------------- | ---------- |
| `action-row`   | `children` |
| `split-button` | `options`  |

---

## Complete Example

```json
{
  "surfaceId": "demo",
  "components": [
    {
      "id": "root",
      "component": {
        "card": {
          "className": "p-6",
          "children": { "explicitList": ["header", "stats", "warning"] }
        }
      }
    },
    {
      "id": "header",
      "component": {
        "text": {
          "variant": "h2",
          "text": { "literalString": "Dashboard" }
        }
      }
    },
    {
      "id": "stats",
      "component": {
        "slat": {
          "label": "Active Users",
          "secondaryLabel": "1,234",
          "variant": "success"
        }
      }
    },
    {
      "id": "warning",
      "component": {
        "alert": {
          "variant": "warning",
          "title": "Maintenance Scheduled",
          "description": "System will be down at 2:00 AM UTC."
        }
      }
    }
  ]
}
```
