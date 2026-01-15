## JSON Structure

```json
{
  "type": "component-name",
  "props": { "propName": "value" },
  "children": ["text", { "type": "nested-component" }]
}
```

## Usage

Render the JSON using the `A2UI` component:

```tsx
import { A2UI } from "doom-design-system";

<A2UI data={jsonData} />;
```

## Available Components

### Primitives

| Type       | Key Props                                                        | Description      |
| ---------- | ---------------------------------------------------------------- | ---------------- |
| `text`     | `variant`: h1/h2/h3/h4/h5/h6/p/small                             | Typography       |
| `button`   | `variant`: primary/secondary/danger/ghost                        | Clickable button |
| `badge`    | `variant`: default/success/warning/error/secondary               | Status indicator |
| `chip`     | `variant`: default/primary                                       | Tag/label        |
| `avatar`   | `fallback`, `size`: sm/md/lg/xl, `src`                           | User avatar      |
| `alert`    | `variant`: default/success/warning/error, `title`, `description` | Alert message    |
| `card`     | `className`                                                      | Container card   |
| `input`    | `label`, `placeholder`, `value`, `disabled`                      | Text input       |
| `textarea` | `label`, `placeholder`, `rows`                                   | Multi-line input |
| `checkbox` | `label`, `checked`, `disabled`                                   | Checkbox         |
| `switch`   | `label`, `checked`                                               | Toggle switch    |
| `label`    | -                                                                | Form label       |
| `link`     | `href`                                                           | Hyperlink        |
| `spinner`  | `size`                                                           | Loading spinner  |

### Layout

| Type        | Key Props                                                  | Description                  |
| ----------- | ---------------------------------------------------------- | ---------------------------- |
| `flex`      | `direction`: row/column, `gap`, `align`, `justify`, `wrap` | Flexbox container            |
| `stack`     | `gap`                                                      | Vertical stack (column flex) |
| `grid`      | `columns`, `gap`                                           | CSS Grid                     |
| `container` | `size`                                                     | Centered container           |
| `switcher`  | `threshold`, `gap`                                         | Responsive row↔column        |
| `box`       | -                                                          | Generic div                  |

### Navigation

| Type              | Key Props      | Description          |
| ----------------- | -------------- | -------------------- |
| `tabs`            | `defaultValue` | Tab container        |
| `tabs-list`       | -              | Tab button container |
| `tabs-trigger`    | `value`        | Tab button           |
| `tabs-body`       | -              | Tab content wrapper  |
| `tabs-content`    | `value`        | Tab panel            |
| `breadcrumbs`     | -              | Breadcrumb container |
| `breadcrumb-item` | `href`         | Breadcrumb link      |

### Data Display

| Type             | Key Props                                                            | Description           |
| ---------------- | -------------------------------------------------------------------- | --------------------- |
| `slat`           | `label`, `secondaryLabel`, `variant`: default/success/warning/danger | List item             |
| `accordion`      | `type`: single/multiple, `defaultValue`                              | Collapsible container |
| `accordion-item` | `value`, `trigger`                                                   | Collapsible section   |
| `chart`          | `type`: line/area/bar, `xKey`, `yKey`, `data`, `title`, `subtitle`   | Data chart            |
| `image`          | `src`, `alt`                                                         | Image                 |
| `table`          | `data`, `columns`                                                    | Data table            |
| `skeleton`       | `width`, `height`                                                    | Loading placeholder   |
| `progress-bar`   | `value`, `variant`: default/success/warning/error                    | Progress indicator    |

## Example

```json
{
  "type": "card",
  "props": { "className": "p-6" },
  "children": [
    {
      "type": "flex",
      "props": { "direction": "column", "gap": 4 },
      "children": [
        {
          "type": "text",
          "props": { "variant": "h2" },
          "children": ["Dashboard"]
        },
        {
          "type": "badge",
          "props": { "variant": "success" },
          "children": ["Active"]
        },
        {
          "type": "slat",
          "props": {
            "label": "System Status",
            "secondaryLabel": "Online",
            "variant": "success"
          }
        }
      ]
    }
  ]
}
```
