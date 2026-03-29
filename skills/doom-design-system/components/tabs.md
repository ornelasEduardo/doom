# Tabs

## Import
```tsx
import { Tabs, TabsList, TabsTrigger, TabsBody, TabsContent } from "doom-design-system";
```

## Props

### Tabs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultValue` | `string` | — | Initial active tab (uncontrolled) |
| `value` | `string` | — | Controlled active tab |
| `onValueChange` | `(value: string) => void` | — | Change callback |

### TabsList

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `"left" \| "right"` | `"left"` | Tab alignment |

### TabsTrigger

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Tab identifier — must match a `TabsContent` value |

### TabsBody

Container for `TabsContent` panels. Required wrapper.

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | `TabsContent` elements |

### TabsContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Tab identifier — must match a `TabsTrigger` value |

## Usage

```tsx
// Basic tabs
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

// Controlled tabs
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList align="right">
    <TabsTrigger value="a">Tab A</TabsTrigger>
    <TabsTrigger value="b">Tab B</TabsTrigger>
  </TabsList>
  <TabsBody>
    <TabsContent value="a">Content A</TabsContent>
    <TabsContent value="b">Content B</TabsContent>
  </TabsBody>
</Tabs>
```

## Notes
- `value` strings in `TabsTrigger` and `TabsContent` must match exactly — mismatches silently break rendering
- Inactive `TabsContent` is unmounted (not hidden with CSS) — do not rely on DOM persistence between tab switches
- Full keyboard navigation and ARIA roles are built in
