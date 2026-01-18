# Sidebar Component

The Sidebar is a complex navigation component supporting dual-mode (Standard and Rail), collapsible sections, groups, and hover-peek functionality.

## Import

```tsx
import { Sidebar } from "doom-design-system";
```

## Props

### Sidebar

| Prop              | Type                                           | Default | Description                                                      |
| ----------------- | ---------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `withRail`        | `boolean`                                      | `false` | Enables the two-column rail navigation.                          |
| `collapsed`       | `boolean`                                      | `false` | Collapses the main panel (standard) or whole sidebar (rail).     |
| `activeSection`   | `string`                                       | —       | The ID of the currently active Section.                          |
| `activeItem`      | `string`                                       | —       | The `href` of the currently active Item.                         |
| `onNavigate`      | `(href: string, e?: React.MouseEvent) => void` | —       | Navigation callback.                                             |
| `onSectionChange` | `(id: string) => void`                         | —       | Callback when the active section changes (useful for Rail mode). |
| `brandIcon`       | `React.ReactNode`                              | —       | Icon displayed at the top of the Sidebar/Rail.                   |

### Sidebar.Section

| Prop       | Type              | Default | Description                                    |
| ---------- | ----------------- | ------- | ---------------------------------------------- |
| `id`       | `string`          | —       | Unique identifier for section switching.       |
| `label`    | `string`          | —       | Descriptive label for the section.             |
| `icon`     | `React.ReactNode` | —       | Icon for the section (required for Rail mode). |
| `expanded` | `boolean`         | —       | Controlled expansion state.                    |

### Sidebar.Group

| Prop       | Type              | Default | Description                      |
| ---------- | ----------------- | ------- | -------------------------------- |
| `id`       | `string`          | —       | Unique identifier for the group. |
| `label`    | `string`          | —       | Descriptive label for the group. |
| `icon`     | `React.ReactNode` | —       | Optional icon for the group.     |
| `expanded` | `boolean`         | —       | Controlled expansion state.      |

### Sidebar.Item

| Prop            | Type              | Default | Description                                     |
| --------------- | ----------------- | ------- | ----------------------------------------------- |
| `href`          | `string`          | —       | Link destination.                               |
| `icon`          | `React.ReactNode` | —       | Optional icon.                                  |
| `appendContent` | `React.ReactNode` | —       | Content (badges, chips) at the end of the item. |

## Usage

### Standard Sidebar

```tsx
<Sidebar activeItem="/home">
  <Sidebar.Header>App Logo</Sidebar.Header>
  <Sidebar.Nav>
    <Sidebar.Section id="main" label="Main" icon={<Home />}>
      <Sidebar.Item href="/home" icon={<Home />}>
        Dashboard
      </Sidebar.Item>
      <Sidebar.Item href="/inbox">Inbox</Sidebar.Item>
    </Sidebar.Section>
  </Sidebar.Nav>
</Sidebar>
```

### Rail Mode with Groups

```tsx
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

## Guidelines

- **Rail Icons**: Ensure every `Sidebar.Section` has an `icon` if `withRail` is enabled.
- **Snappy UI**: The component uses instant transitions for a high-performance feel.
- **Auto-collapse**: In rail mode, clicking an item auto-collapses to save space.
- **Accessibility**: Collapsed content is hidden via `display: none` to remove it from keyboard tab order.
