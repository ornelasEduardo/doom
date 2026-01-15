# A2UI Examples

## Example 1: Login Card

**User Request**: "A login card with email and password fields, and a submit button."

```json
{
  "type": "card",
  "props": { "className": "p-6 w-full", "style": { "maxWidth": "24rem" } },
  "children": [
    {
      "type": "stack",
      "props": { "gap": 4 },
      "children": [
        { "type": "text", "props": { "variant": "h3" }, "children": ["Login"] },
        {
          "type": "input",
          "props": { "label": "Email", "placeholder": "you@example.com" }
        },
        {
          "type": "input",
          "props": { "label": "Password", "type": "password" }
        },
        {
          "type": "button",
          "props": { "variant": "primary", "className": "w-full" },
          "children": ["Sign In"]
        }
      ]
    }
  ]
}
```

## Example 2: Dashboard Stats

**User Request**: "A generic dashboard row with 3 stat cards for Users, Revenue, and Growth."

```json
{
  "type": "grid",
  "props": { "columns": 3, "gap": 4 },
  "children": [
    {
      "type": "card",
      "props": { "className": "p-4" },
      "children": [
        {
          "type": "text",
          "props": { "variant": "small", "className": "text-muted" },
          "children": ["Total Users"]
        },
        { "type": "text", "props": { "variant": "h2" }, "children": ["1,234"] }
      ]
    },
    {
      "type": "card",
      "props": { "className": "p-4" },
      "children": [
        {
          "type": "text",
          "props": { "variant": "small", "className": "text-muted" },
          "children": ["Revenue"]
        },
        { "type": "text", "props": { "variant": "h2" }, "children": ["$45.2k"] }
      ]
    },
    {
      "type": "card",
      "props": { "className": "p-4" },
      "children": [
        {
          "type": "text",
          "props": { "variant": "small", "className": "text-muted" },
          "children": ["Growth"]
        },
        {
          "type": "badge",
          "props": { "variant": "success" },
          "children": ["+12%"]
        }
      ]
    }
  ]
}
```

## Example 3: Complex Layout

**User Request**: "A split view with a sidebar navigation and a main content area containing a chart."

```json
{
  "type": "grid",
  "props": { "columns": "250px 1fr", "gap": 6, "className": "h-screen p-6" },
  "children": [
    {
      "type": "card",
      "props": { "className": "h-full p-4" },
      "children": [
        {
          "type": "stack",
          "props": { "gap": 2 },
          "children": [
            {
              "type": "button",
              "props": { "variant": "ghost", "className": "w-full text-left" },
              "children": ["Home"]
            },
            {
              "type": "button",
              "props": { "variant": "ghost", "className": "w-full text-left" },
              "children": ["Analytics"]
            },
            {
              "type": "button",
              "props": { "variant": "ghost", "className": "w-full text-left" },
              "children": ["Settings"]
            }
          ]
        }
      ]
    },
    {
      "type": "stack",
      "props": { "gap": 6 },
      "children": [
        {
          "type": "text",
          "props": { "variant": "h1" },
          "children": ["Analytics Overview"]
        },
        {
          "type": "chart",
          "props": {
            "type": "area",
            "title": "Traffic",
            "data": [
              { "name": "Jan", "value": 400 },
              { "name": "Feb", "value": 300 }
            ],
            "xKey": "name",
            "yKey": "value",
            "style": { "height": 400 }
          }
        }
      ]
    }
  ]
}
```
