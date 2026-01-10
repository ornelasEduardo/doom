# Accordion Component

## Import

```tsx
import { Accordion, AccordionItem } from "doom-design-system";
```

## Props

### Accordion

| Prop            | Type                     | Default    | Description                |
| --------------- | ------------------------ | ---------- | -------------------------- |
| `type`          | `"single" \| "multiple"` | `"single"` | Allow one or multiple open |
| `defaultValue`  | `string \| string[]`     | —          | Initial open item(s)       |
| `value`         | `string \| string[]`     | —          | Controlled value           |
| `onValueChange` | `(value) => void`        | —          | Change callback            |

### AccordionItem

| Prop       | Type        | Description       |
| ---------- | ----------- | ----------------- |
| `value`    | `string`    | Unique identifier |
| `trigger`  | `string`    | Header text       |
| `children` | `ReactNode` | Panel content     |

## Usage

```tsx
<Accordion type="single" defaultValue="item-1">
  <AccordionItem value="item-1" trigger="Section 1">
    Content for section 1
  </AccordionItem>
  <AccordionItem value="item-2" trigger="Section 2">
    Content for section 2
  </AccordionItem>
</Accordion>
```

## Guidelines

- Use `type="multiple"` for FAQ sections where users may want multiple open.
- Use `type="single"` (default) for navigation or settings panels.
