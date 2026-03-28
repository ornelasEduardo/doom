# A2UI Examples

## ⚠️ Text Prop Usage

**IMPORTANT**: Not all components support `text: { literalString }`. Check which prop to use:

| Component                                          | ✅ Correct Prop           | ❌ Don't Use |
| -------------------------------------------------- | ------------------------- | ------------ |
| `text`, `button`, `badge`, `chip`, `label`, `link` | `text: { literalString }` | -            |
| `slat`                                             | `label`, `secondaryLabel` | `text`       |
| `alert`                                            | `title`, `description`    | `text`       |
| `input`                                            | `label`, `placeholder`    | `text`       |

---

## Example 1: Login Card

**User Request**: "A login card with email and password fields, and a submit button."

```json
{
  "surfaceId": "login",
  "components": [
    {
      "id": "root",
      "component": {
        "card": {
          "className": "p-6 w-full",
          "style": { "maxWidth": "24rem" },
          "child": "content"
        }
      }
    },
    {
      "id": "content",
      "component": {
        "stack": {
          "gap": 4,
          "children": {
            "explicitList": ["title", "email", "password", "submit"]
          }
        }
      }
    },
    {
      "id": "title",
      "component": {
        "text": { "variant": "h3", "text": { "literalString": "Login" } }
      }
    },
    {
      "id": "email",
      "component": {
        "input": { "label": "Email", "placeholder": "you@example.com" }
      }
    },
    {
      "id": "password",
      "component": {
        "input": { "label": "Password", "type": "password" }
      }
    },
    {
      "id": "submit",
      "component": {
        "button": {
          "variant": "primary",
          "className": "w-full",
          "text": { "literalString": "Sign In" }
        }
      }
    }
  ]
}
```

## Example 2: Dashboard with Slats and Alerts

**User Request**: "Dashboard stats using slat components and a warning alert."

```json
{
  "surfaceId": "dashboard",
  "components": [
    {
      "id": "root",
      "component": {
        "stack": {
          "gap": 4,
          "children": { "explicitList": ["stats-grid", "warning"] }
        }
      }
    },
    {
      "id": "stats-grid",
      "component": {
        "grid": {
          "columns": 3,
          "gap": 4,
          "children": {
            "explicitList": ["users-slat", "revenue-slat", "growth-slat"]
          }
        }
      }
    },
    {
      "id": "users-slat",
      "component": {
        "slat": {
          "label": "Total Users",
          "secondaryLabel": "1,234"
        }
      }
    },
    {
      "id": "revenue-slat",
      "component": {
        "slat": {
          "label": "Revenue",
          "secondaryLabel": "$45.2k"
        }
      }
    },
    {
      "id": "growth-slat",
      "component": {
        "slat": {
          "variant": "success",
          "label": "Growth",
          "secondaryLabel": "+12%"
        }
      }
    },
    {
      "id": "warning",
      "component": {
        "alert": {
          "variant": "warning",
          "title": "Maintenance Scheduled",
          "description": "System will be down for maintenance at 2:00 AM UTC."
        }
      }
    }
  ]
}
```

## Example 3: Data Binding

**User Request**: "A user greeting that displays the user's name from data."

```json
{
  "surfaceId": "greeting",
  "components": [
    {
      "id": "root",
      "component": {
        "card": {
          "className": "p-6",
          "children": { "explicitList": ["welcome", "name"] }
        }
      }
    },
    {
      "id": "welcome",
      "component": {
        "text": {
          "variant": "small",
          "className": "text-muted",
          "text": { "literalString": "Welcome back," }
        }
      }
    },
    {
      "id": "name",
      "component": {
        "text": {
          "variant": "h2",
          "text": { "path": "/user/name" }
        }
      }
    }
  ]
}
```

**Data Model:**

```json
{
  "user": { "name": "Alice Chen" }
}
```

## Example 4: Navigation with Tabs

**User Request**: "A tabbed interface with Overview and Settings tabs."

```json
{
  "surfaceId": "tabbed-ui",
  "components": [
    {
      "id": "root",
      "component": {
        "tabs": {
          "defaultValue": "overview",
          "children": { "explicitList": ["tab-list", "tab-body"] }
        }
      }
    },
    {
      "id": "tab-list",
      "component": {
        "tabs-list": {
          "children": { "explicitList": ["tab-overview", "tab-settings"] }
        }
      }
    },
    {
      "id": "tab-overview",
      "component": {
        "tabs-trigger": {
          "value": "overview",
          "text": { "literalString": "Overview" }
        }
      }
    },
    {
      "id": "tab-settings",
      "component": {
        "tabs-trigger": {
          "value": "settings",
          "text": { "literalString": "Settings" }
        }
      }
    },
    {
      "id": "tab-body",
      "component": {
        "tabs-body": {
          "children": {
            "explicitList": ["content-overview", "content-settings"]
          }
        }
      }
    },
    {
      "id": "content-overview",
      "component": {
        "tabs-content": { "value": "overview", "child": "overview-text" }
      }
    },
    {
      "id": "overview-text",
      "component": {
        "text": { "text": { "literalString": "This is the overview content." } }
      }
    },
    {
      "id": "content-settings",
      "component": {
        "tabs-content": { "value": "settings", "child": "settings-text" }
      }
    },
    {
      "id": "settings-text",
      "component": {
        "text": { "text": { "literalString": "This is the settings content." } }
      }
    }
  ]
}
```

---

## Quick Reference

**Supports `text` prop (→ children):**
`text`, `label`, `button`, `badge`, `chip`, `link`, `tabs-trigger`, `breadcrumb-item`

**Use specific props instead:**

- `slat` → `label` + `secondaryLabel`
- `alert` → `title` + `description`
- `input` → `label` + `placeholder`
- `avatar` → `fallback`
