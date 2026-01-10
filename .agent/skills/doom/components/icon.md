# Icon Component

## Import

```tsx
import { Home, User, Settings, ... } from "doom-design-system";
// or directly from lucide-react
import { Home, User, Settings } from "lucide-react";
```

## Usage

```tsx
<Home />
<User size={24} strokeWidth={2.5} />
<Settings className="text-primary" />
```

## Neubrutalism Style

For bold neubrutalist icons, use:

- `strokeWidth={2.5}` or `strokeWidth={3}`

## Available Icons

Re-exported from Lucide React for convenience:

**Finance**: `DollarSign`, `TrendingUp`, `TrendingDown`, `PiggyBank`, `Wallet`, `CreditCard`, `Banknote`

**Charts**: `BarChart3`, `LineChart`, `PieChart`

**Status**: `AlertTriangle`, `AlertCircle`, `Info`, `CheckCircle2`, `XCircle`

**Actions**: `Plus`, `Minus`, `X`, `Check`, `Edit`, `Trash2`, `Save`, `Search`, `Filter`, `Upload`, `Download`, `Eye`, `EyeOff`

**Navigation**: `Home`, `ChevronDown`, `ChevronUp`, `ChevronLeft`, `ChevronRight`, `ArrowUpRight`, `ArrowDownRight`, `MoreHorizontal`, `MoreVertical`

**Time**: `Calendar`, `Clock`

**User**: `User`, `Settings`, `LogOut`

## Guidelines

- Import from `doom-design-system` for commonly used icons.
- Import directly from `lucide-react` for less common icons.
- All Lucide props are supported (size, color, className, etc.).
