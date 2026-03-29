# Accordion

## Import
```tsx
import { Accordion, AccordionItem } from "doom-design-system";
```

## Props

### Accordion

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"single" \| "multiple"` | `"single"` | Allow one or multiple panels open |
| `defaultValue` | `string \| string[]` | — | Initially open item(s) (uncontrolled) |
| `value` | `string \| string[]` | — | Controlled open value(s) |
| `onValueChange` | `(value: string \| string[]) => void` | — | Change callback |

### AccordionItem

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Unique identifier for this item |
| `trigger` | `string` | required | Header/trigger text |
| `children` | `ReactNode` | required | Panel content |

## Usage

```tsx
// Single open (default)
<Accordion type="single" defaultValue="item-1">
  <AccordionItem value="item-1" trigger="Section 1">
    Content for section 1
  </AccordionItem>
  <AccordionItem value="item-2" trigger="Section 2">
    Content for section 2
  </AccordionItem>
</Accordion>

// Multiple open — FAQ style
<Accordion type="multiple">
  <AccordionItem value="faq-1" trigger="How do I reset my password?">
    Go to Settings → Security → Reset Password.
  </AccordionItem>
</Accordion>
```

## Notes
- Use `type="multiple"` for FAQs where users may want multiple sections open simultaneously
- Use `type="single"` (default) for settings panels or navigation where only one section should be active
- `value` and `onValueChange` enable controlled mode; omit for uncontrolled with `defaultValue`
