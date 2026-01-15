# A2UI

The `A2UI` component renders a UI tree from a declarative JSON structure, enabling AI agents and external sources to generate Doom Design System interfaces dynamically.

## Import

```tsx
import { A2UI } from "doom-design-system";
```

## Usage

Pass the JSON tree to the `data` prop. The JSON must adhere to the [A2UI Protocol Schema](a2ui-protocol.md).

```tsx
const data = {
  type: "card",
  props: { className: "p-6" },
  children: [
    {
      type: "button",
      props: { variant: "primary" },
      children: ["Rendered from JSON"],
    },
  ],
};

return <A2UI data={data} />;
```

## Props

| Prop   | Type       | Description                                  |
| ------ | ---------- | -------------------------------------------- |
| `data` | `A2UINode` | The JSON tree root node to render. Required. |

## Types

```tsx
interface A2UINode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  children?: (A2UINode | string)[];
}
```
