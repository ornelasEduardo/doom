# Image Component

## Import

```tsx
import { Image } from "doom-design-system";
```

## Props

| Prop          | Type                                                       | Default | Description                 |
| ------------- | ---------------------------------------------------------- | ------- | --------------------------- |
| `src`         | `string`                                                   | —       | Image source URL            |
| `alt`         | `string`                                                   | —       | Alt text                    |
| `fit`         | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | —       | Object-fit                  |
| `fallbackSrc` | `string`                                                   | —       | Fallback image URL on error |
| `aspectRatio` | `string \| number`                                         | —       | CSS aspect-ratio            |
| `rounded`     | `boolean`                                                  | `true`  | Apply border-radius         |
| `width`       | `string \| number`                                         | —       | Image width                 |
| `height`      | `string \| number`                                         | —       | Image height                |

Plus all standard `<img>` attributes.

## Usage

```tsx
<Image
  src="/product.jpg"
  alt="Product photo"
  aspectRatio="16/9"
  fit="cover"
/>

<Image
  src={user.avatar}
  fallbackSrc="/default-avatar.png"
  width={200}
  height={200}
  rounded
/>
```

## Guidelines

- Automatically shows skeleton loader while image loads.
- Smooth crossfade transition when image loads.
- Use `fallbackSrc` for graceful degradation.
- `aspectRatio` auto-computed from width/height if not specified.
