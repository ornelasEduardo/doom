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

### Sidebar.Section

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique ID for section switching |
| `label` | `string` | — | Section label |
| `icon` | `React.ReactNode` | — | Icon (required in rail mode) |
| `expanded` | `boolean` | — | Controlled expansion state |

### Sidebar.Group

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | — | Unique ID |
| `label` | `string` | — | Group label |
| `icon` | `React.ReactNode` | — | Optional group icon |
| `expanded` | `boolean` | — | Controlled expansion state |

### Sidebar.Item

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | — | Link destination |
| `icon` | `React.ReactNode` | — | Optional item icon |
| `appendContent` | `React.ReactNode` | — | Trailing content (badges, chips) |

## Usage

```tsx
// Standard sidebar
<Sidebar activeItem="/home">
  <Sidebar.Header>App Logo</Sidebar.Header>
  <Sidebar.Nav>
    <Sidebar.Section id="main" label="Main" icon={<Home />}>
      <Sidebar.Item href="/home" icon={<Home />}>Dashboard</Sidebar.Item>
      <Sidebar.Item href="/inbox">Inbox</Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
</Sidebar>

// Rail mode with grouped items
<Sidebar withRail activeSection="admin">
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
```

## Notes
- Every `Sidebar.Section` must have an `icon` when `withRail` is enabled
- Collapsed content is hidden via `display: none` — removed from keyboard tab order entirely
- In rail mode, clicking an item auto-collapses the panel to save space
- Transitions are instant (no animation) for performance
