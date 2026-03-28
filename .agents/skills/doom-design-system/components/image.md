# Image

## Import
```tsx
import { Image } from "doom-design-system";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Image source URL |
| `alt` | `string` | — | Alt text |
| `fit` | `"cover" \| "contain" \| "fill" \| "none" \| "scale-down"` | — | CSS object-fit |
| `fallbackSrc` | `string` | — | Fallback image URL on load error |
| `aspectRatio` | `string \| number` | — | CSS aspect-ratio value |
| `rounded` | `boolean` | `true` | Apply border-radius |
| `width` | `string \| number` | — | Image width |
| `height` | `string \| number` | — | Image height |

Extends all standard `<img>` HTML attributes.

## Usage

```tsx
// Responsive image with aspect ratio
<Image src="/product.jpg" alt="Product photo" aspectRatio="16/9" fit="cover" />

// Image with fallback
<Image src={user.avatar} fallbackSrc="/default-avatar.png" width={200} height={200} rounded />
```

## Notes
- Automatically shows a skeleton loader while the image is loading
- Smooth crossfade transition plays when image finishes loading
- `aspectRatio` is auto-computed from `width`/`height` if not explicitly set
- `fallbackSrc` displays if the primary `src` fails to load
