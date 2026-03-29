# Utility Classes

Available globally via `styles/_utilities.scss` (included in globals).

## Display

| Class           | Property               |
| --------------- | ---------------------- |
| `.flex`         | `display: flex`        |
| `.grid`         | `display: grid`        |
| `.hidden`       | `display: none`        |
| `.block`        | `display: block`       |
| `.inline-block` | `display: inline-block`|
| `.inline-flex`  | `display: inline-flex` |

## Flexbox

| Class               | Property                         |
| ------------------- | -------------------------------- |
| `.flex-row`         | `flex-direction: row`            |
| `.flex-col`         | `flex-direction: column`         |
| `.flex-row-reverse` | `flex-direction: row-reverse`    |
| `.flex-col-reverse` | `flex-direction: column-reverse` |
| `.flex-wrap`        | `flex-wrap: wrap`                |
| `.flex-nowrap`      | `flex-wrap: nowrap`              |
| `.items-start`      | `align-items: flex-start`        |
| `.items-center`     | `align-items: center`            |
| `.items-end`        | `align-items: flex-end`          |
| `.items-stretch`    | `align-items: stretch`           |
| `.justify-start`    | `justify-content: flex-start`    |
| `.justify-center`   | `justify-content: center`        |
| `.justify-end`      | `justify-content: flex-end`      |
| `.justify-between`  | `justify-content: space-between` |
| `.justify-around`   | `justify-content: space-around`  |

## Grid

| Class               | Property                                |
| ------------------- | --------------------------------------- |
| `.grid-cols-{1-12}` | `grid-template-columns: repeat(n, 1fr)` |

## Spacing

All spacing uses 4px increments (0-10). Value = N * 0.25rem.

| Class           | Property           |
| --------------- | ------------------ |
| `.gap-{0-10}`   | Gap                |
| `.gap-x-{0-10}` | Column gap         |
| `.gap-y-{0-10}` | Row gap            |
| `.m-{0-10}`     | Margin all         |
| `.mt-{0-10}`    | Margin top         |
| `.mb-{0-10}`    | Margin bottom      |
| `.ml-{0-10}`    | Margin left        |
| `.mr-{0-10}`    | Margin right       |
| `.mx-{0-10}`    | Margin horizontal  |
| `.my-{0-10}`    | Margin vertical    |
| `.p-{0-10}`     | Padding all        |
| `.pt-{0-10}`    | Padding top        |
| `.pb-{0-10}`    | Padding bottom     |
| `.pl-{0-10}`    | Padding left       |
| `.pr-{0-10}`    | Padding right      |
| `.px-{0-10}`    | Padding horizontal |
| `.py-{0-10}`    | Padding vertical   |

## Position

| Class           | Property             |
| --------------- | -------------------- |
| `.relative`     | `position: relative` |
| `.absolute`     | `position: absolute` |
| `.fixed`        | `position: fixed`    |
| `.top-{0-10}`   | `top: N * 0.25rem`   |
| `.bottom-{0-10}`| `bottom: N * 0.25rem`|
| `.left-{0-10}`  | `left: N * 0.25rem`  |
| `.right-{0-10}` | `right: N * 0.25rem` |

## Typography

| Class                    | Property                                   |
| ------------------------ | ------------------------------------------ |
| `.text-{2xs-6xl}`        | Font size (matches `--text-*` tokens)      |
| `.font-{thin-black}`     | Font weight (matches `--font-*` tokens)    |
| `.text-{color}`          | Color: primary, secondary, muted, success, warning, error, background, foreground |
| `.bg-{color}`            | Background color (same set as `.text-*`)   |
| `.uppercase`             | `text-transform: uppercase`                |
| `.italic`                | `font-style: italic`                       |
| `.text-center`           | `text-align: center`                       |
| `.text-right`            | `text-align: right`                        |

Note: `.text-muted` maps to `--muted-foreground` (not `--muted`).

## Sizing

| Class       | Property        |
| ----------- | --------------- |
| `.w-full`   | `width: 100%`   |
| `.w-auto`   | `width: auto`   |
| `.h-full`   | `height: 100%`  |
| `.h-auto`   | `height: auto`  |
| `.h-screen` | `height: 100vh` |

## Misc

| Class               | Property                   |
| ------------------- | -------------------------- |
| `.cursor-pointer`   | `cursor: pointer`          |
| `.cursor-not-allowed`| `cursor: not-allowed`     |
| `.transition-all`   | `transition: all 0.2s ease`|

## Shadows

| Class                                  | Property                  |
| -------------------------------------- | ------------------------- |
| `.shadow-hard`                         | Standard brutalist shadow |
| `.shadow-{top/bottom/left/right}-hard` | Directional shadows (8px) |

## Responsive Prefixes

Breakpoints: `xxs:`, `xs:`, `sm:`, `md:`, `lg:`, `xl:`

Available responsive utilities (subset to avoid CSS bloat):

| Category | Classes |
| -------- | ------- |
| Display  | `{bp}:hidden`, `{bp}:block`, `{bp}:flex`, `{bp}:grid` |
| Flex     | `{bp}:flex-row`, `{bp}:flex-col` |
| Grid     | `{bp}:grid-cols-{1-4}` |
| Sizing   | `{bp}:w-full`, `{bp}:w-auto` |
| Spacing  | `{bp}:p-{0-8}`, `{bp}:m-{0-8}`, `{bp}:gap-{0-8}` |

```html
<div class="flex-col md:flex-row gap-4 md:gap-6">
  <!-- Column on mobile, row on md+ -->
</div>
```
