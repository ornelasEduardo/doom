# Utility Classes

Available globally via `styles/_utilities.scss` (included in globals).

## Display

| Class          | Property               |
| -------------- | ---------------------- |
| `.flex`        | `display: flex`        |
| `.grid`        | `display: grid`        |
| `.hidden`      | `display: none`        |
| `.block`       | `display: block`       |
| `.inline-flex` | `display: inline-flex` |

## Flexbox

| Class              | Property                         |
| ------------------ | -------------------------------- |
| `.flex-row`        | `flex-direction: row`            |
| `.flex-col`        | `flex-direction: column`         |
| `.flex-wrap`       | `flex-wrap: wrap`                |
| `.items-center`    | `align-items: center`            |
| `.items-start`     | `align-items: flex-start`        |
| `.items-end`       | `align-items: flex-end`          |
| `.justify-center`  | `justify-content: center`        |
| `.justify-between` | `justify-content: space-between` |
| `.justify-end`     | `justify-content: flex-end`      |

## Grid

| Class               | Property                                |
| ------------------- | --------------------------------------- |
| `.grid-cols-{1-12}` | `grid-template-columns: repeat(n, 1fr)` |

## Spacing

All spacing uses 4px increments (0-10).

| Class         | Property           |
| ------------- | ------------------ |
| `.gap-{0-10}` | Gap                |
| `.m-{0-10}`   | Margin all         |
| `.mt-{0-10}`  | Margin top         |
| `.mb-{0-10}`  | Margin bottom      |
| `.mx-{0-10}`  | Margin horizontal  |
| `.my-{0-10}`  | Margin vertical    |
| `.p-{0-10}`   | Padding all        |
| `.px-{0-10}`  | Padding horizontal |
| `.py-{0-10}`  | Padding vertical   |

## Typography

| Class                   | Property                            |
| ----------------------- | ----------------------------------- |
| `.text-{xs-6xl}`        | Font size                           |
| `.font-{regular-black}` | Font weight                         |
| `.text-{color}`         | Color (primary, muted, error, etc.) |
| `.uppercase`            | Text transform                      |
| `.text-center`          | Text align                          |

## Sizing

| Class       | Property        |
| ----------- | --------------- |
| `.w-full`   | `width: 100%`   |
| `.h-full`   | `height: 100%`  |
| `.h-screen` | `height: 100vh` |

## Responsive Prefixes

Use breakpoint prefixes: `sm:`, `md:`, `lg:`, `xl:`

```html
<div class="flex-col md:flex-row">
  <!-- Column on mobile, row on md+ -->
</div>
```

## Shadows

| Class                                  | Property                  |
| -------------------------------------- | ------------------------- |
| `.shadow-hard`                         | Standard brutalist shadow |
| `.shadow-{top/bottom/left/right}-hard` | Directional shadows       |
