# Tabs Component

## Import

```tsx
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsBody,
  TabsContent,
} from "doom-design-system";
```

## Props

### Tabs

| Prop            | Type                      | Default | Description           |
| --------------- | ------------------------- | ------- | --------------------- |
| `defaultValue`  | `string`                  | —       | Initial active tab    |
| `value`         | `string`                  | —       | Controlled active tab |
| `onValueChange` | `(value: string) => void` | —       | Change callback       |

### TabsList

| Prop    | Type                | Default  | Description   |
| ------- | ------------------- | -------- | ------------- |
| `align` | `"left" \| "right"` | `"left"` | Tab alignment |

### TabsTrigger

| Prop    | Type     | Description                        |
| ------- | -------- | ---------------------------------- |
| `value` | `string` | Tab value (must match TabsContent) |

### TabsContent

| Prop    | Type     | Description                        |
| ------- | -------- | ---------------------------------- |
| `value` | `string` | Tab value (must match TabsTrigger) |

## Usage

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
  </TabsList>

  <TabsBody>
    <TabsContent value="overview">Overview content...</TabsContent>
    <TabsContent value="settings">Settings content...</TabsContent>
    <TabsContent value="team">Team content...</TabsContent>
  </TabsBody>
</Tabs>
```

## Guidelines

- Match `value` props between `TabsTrigger` and `TabsContent`.
- Only active `TabsContent` renders (not hidden with CSS).
- Full keyboard navigation and ARIA support.
