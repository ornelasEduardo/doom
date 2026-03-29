# Sidebar

## Import
```tsx
import { Sidebar } from "doom-design-system";
```

## Props

### Sidebar

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `withRail` | `boolean` | `false` | Enables two-column rail navigation |
| `collapsed` | `boolean` | `false` | Collapses main panel (standard) or entire sidebar (rail) |
| `activeSection` | `string` | — | ID of the currently active Section |
| `activeItem` | `string` | — | `href` of the currently active Item |
| `onNavigate` | `(href: string, e?: React.MouseEvent) => void` | — | Navigation callback |
| `onSectionChange` | `(id: string) => void` | — | Callback when active section changes (rail mode) |
| `brandIcon` | `React.ReactNode` | — | Icon displayed at top of sidebar/rail |
| `className` | `string` | — | CSS class name |

### Sidebar.Header

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Header content (logo, app name) |
| `className` | `string` | CSS class name |

### Sidebar.Nav

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Sections (required wrapper for navigation content) |
| `className` | `string` | CSS class name |

### Sidebar.Section

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique ID for section switching |
| `label` | `string` | — | Section label |
| `icon` | `React.ReactNode` | required | Icon (always required, shown in rail and as collapse toggle) |
| `expanded` | `boolean` | — | Controlled expansion state |
| `className` | `string` | — | CSS class name |

### Sidebar.Group

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique ID |
| `label` | `string` | — | Group label |
| `icon` | `React.ReactNode` | — | Optional group icon |
| `expanded` | `boolean` | — | Controlled expansion state |
| `className` | `string` | — | CSS class name |

### Sidebar.Item

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | — | Link destination (optional — renders as `<button>` when omitted) |
| `icon` | `React.ReactNode` | — | Optional item icon |
| `appendContent` | `React.ReactNode` | — | Trailing content (badges, chips) |
| `onClick` | `(e?: React.MouseEvent) => void` | — | Click handler |

### Sidebar.Footer

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Footer content |
| `className` | `string` | CSS class name |

### Sidebar.MobileTrigger

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Custom trigger content (defaults to hamburger icon) |
| `className` | `string` | CSS class name |

## Usage

```tsx
// Standard sidebar
<Sidebar activeItem="/home" onNavigate={(href) => router.push(href)}>
  <Sidebar.Header>App Logo</Sidebar.Header>
  <Sidebar.Nav>
    <Sidebar.Section id="main" label="Main" icon={<Home />}>
      <Sidebar.Item href="/home" icon={<Home />}>Dashboard</Sidebar.Item>
      <Sidebar.Item href="/inbox">Inbox</Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
  <Sidebar.Footer>Footer content</Sidebar.Footer>
</Sidebar>

// Rail mode with grouped items
<Sidebar withRail activeSection="admin" onSectionChange={setSection}>
  <Sidebar.Nav>
    <Sidebar.Section id="main" label="Main" icon={<Home />}>
      <Sidebar.Item href="/home">Home</Sidebar.Item>
    </Sidebar.Section>
    <Sidebar.Section id="admin" label="Admin" icon={<Settings />}>
      <Sidebar.Group id="users" label="User Management">
        <Sidebar.Item href="/users/list">User List</Sidebar.Item>
        <Sidebar.Item href="/users/permissions">Permissions</Sidebar.Item>
      </Sidebar.Group>
    </Sidebar.Section>
  </Sidebar.Nav>
</Sidebar>

// Mobile trigger (place outside Sidebar in your layout)
<Sidebar.MobileTrigger />
```

## Notes
- `Sidebar.Section` `icon` is always required (used in rail mode and as collapse toggle)
- `Sidebar.Item` renders as `<a>` when `href` is provided, `<button>` when omitted
- Sections and groups with an active child item auto-expand automatically
- In rail mode, hovering over a rail icon shows that section's content (peeking behavior)
- Mobile overlay: renders via portal, locks body scroll, closes on Escape key
- Navigation auto-closes mobile overlay (`setMobileOpen(false)` on navigate)
- Item clicks automatically activate their parent section via internal context mapping
- Collapsed content is hidden via `display: none` — removed from keyboard tab order
