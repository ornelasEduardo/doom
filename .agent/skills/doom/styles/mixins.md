# SCSS Mixins

Available in `styles/_mixins.scss`. Import with `@use "../../styles/mixins" as m;`.

## Interactive Element Mixins

### `base-interactive`

Base styles for clickable elements (border, shadow, transition).

```scss
.myButton {
  @include m.base-interactive;
}
```

### `focus`

Focus states with keyboard navigation support (`focus-visible`).

```scss
.myInput {
  @include m.focus;
}
```

### `error`

Error state styling (red border + error shadow).

```scss
.myInput {
  &.hasError {
    @include m.error;
  }
}
```

### `brutalist-hover($lift, $shadow-color)`

Hover effect with lift and shadow grow.

```scss
.myCard {
  @include m.brutalist-hover(2px, var(--shadow-base));
}
```

### `disabled-state`

Disabled styling with hatched pattern overlay.

```scss
.myButton:disabled {
  @include m.disabled-state;
}
```

## Theme Mixins

### `invert-theme`

Inverts theme for content on primary-colored backgrounds.

### `solid-variant`

Applies solid variant styling (used by Modal, Sheet, Drawer with `variant="solid"`).

## Shadow Mixins

### `brutalist-shadow($direction, $size, $color)`

Directional hard shadows.

```scss
.myElement {
  @include m.brutalist-shadow("left", 8px, var(--shadow-base));
}
```

Directions: `standard`, `top`, `bottom`, `left`, `right`

## Responsive

### `mq($breakpoint, $type)`

Media query helper.

```scss
.myElement {
  @include m.mq("md") {
    flex-direction: row;
  }
}
```

Breakpoints: `xxs` (360px), `xs` (480px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
