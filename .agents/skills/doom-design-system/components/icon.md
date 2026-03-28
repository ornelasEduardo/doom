# Icon

## Import
```tsx
// From doom-design-system (commonly used subset)
import { Home, User, Settings } from "doom-design-system";

// From lucide-react directly (full library)
import { Home, User, Settings } from "lucide-react";
```

## Props

All standard Lucide icon props are supported.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `24` | Width and height |
| `strokeWidth` | `number` | `2` | Stroke thickness |
| `color` | `string` | `"currentColor"` | Icon color |
| `className` | `string` | — | CSS class |

## Usage

```tsx
// Default usage
<Home />
<User size={24} strokeWidth={2.5} />
<Settings className="text-primary" />
```

## Available Icons (re-exported from doom-design-system)

| Category | Icons |
|----------|-------|
| Finance | `DollarSign`, `TrendingUp`, `TrendingDown`, `PiggyBank`, `Wallet`, `CreditCard`, `Banknote` |
| Charts | `BarChart3`, `LineChart`, `PieChart` |
| Status | `AlertTriangle`, `AlertCircle`, `Info`, `CheckCircle2`, `XCircle` |
| Actions | `Plus`, `Minus`, `X`, `Check`, `Edit`, `Trash2`, `Save`, `Search`, `Filter`, `Upload`, `Download`, `Eye`, `EyeOff` |
| Navigation | `Home`, `ChevronDown`, `ChevronUp`, `ChevronLeft`, `ChevronRight`, `ArrowUpRight`, `ArrowDownRight`, `MoreHorizontal`, `MoreVertical` |
| Time | `Calendar`, `Clock` |
| User | `User`, `Settings`, `LogOut` |

## Notes
- For icons not in the re-exported set, import directly from `lucide-react`
- Use `strokeWidth={2.5}` or `strokeWidth={3}` for the neubrutalist bold style
- All Lucide props (`size`, `color`, `className`, `onClick`, etc.) work on every icon
