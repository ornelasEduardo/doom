/**
 * A2UI Component Catalog
 *
 * Machine-readable catalog of available components for AI/LLM consumption.
 * This is the single source of truth for component metadata.
 *
 * @see https://a2ui.org/reference/messages/ for catalogId specification
 */

/**
 * Describes a single component prop
 */
export interface PropDescriptor {
  /** Prop name */
  name: string;
  /** TypeScript-style type description */
  type: string;
  /** Whether the prop is required */
  required?: boolean;
  /** Human-readable description */
  description: string;
  /** Default value if any */
  default?: string;
}

/**
 * Describes a component in the catalog
 */
export interface ComponentDescriptor {
  /** Component type key (matches mapping.tsx) */
  type: string;
  /** Human-readable name */
  name: string;
  /** Category for grouping */
  category:
    | "primitives"
    | "layout"
    | "navigation"
    | "feedback"
    | "data-display"
    | "actions";
  /** Brief description */
  description: string;
  /** Whether this component receives text via the `text` prop (mapped to children) */
  usesTextProp?: boolean;
  /** List of key props */
  props: PropDescriptor[];
}

/**
 * The full component catalog
 */
export const componentCatalog: ComponentDescriptor[] = [
  // ─────────────────────────────────────────────────────────────
  // PRIMITIVES
  // ─────────────────────────────────────────────────────────────
  {
    type: "label",
    name: "Label",
    category: "primitives",
    description: "Text label, typically for form fields",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        required: true,
        description: "Text content ({ literalString } or { path })",
      },
      {
        name: "required",
        type: "boolean",
        description: "Show required indicator",
      },
    ],
  },
  {
    type: "text",
    name: "Text",
    category: "primitives",
    description: "Typography component for headings and body text",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        description: "Text content ({ literalString } or { path })",
      },
      {
        name: "variant",
        type: "'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small'",
        description: "Typography variant",
        default: "body",
      },
      {
        name: "weight",
        type: "'normal' | 'medium' | 'semibold' | 'bold'",
        description: "Font weight",
      },
      {
        name: "color",
        type: "'foreground' | 'muted' | 'primary' | 'success' | 'warning' | 'error'",
        description: "Text color",
      },
    ],
  },
  {
    type: "button",
    name: "Button",
    category: "primitives",
    description: "Clickable button for actions",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        description: "Button label ({ literalString } or { path })",
      },
      {
        name: "variant",
        type: "'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger'",
        description: "Button style",
        default: "primary",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg'",
        description: "Button size",
        default: "md",
      },
      { name: "disabled", type: "boolean", description: "Disable the button" },
      { name: "loading", type: "boolean", description: "Show loading spinner" },
    ],
  },
  {
    type: "badge",
    name: "Badge",
    category: "primitives",
    description: "Status indicator badge",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        description: "Badge label ({ literalString } or { path })",
      },
      {
        name: "variant",
        type: "'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'outline'",
        description: "Badge style",
        default: "primary",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg'",
        description: "Badge size",
        default: "md",
      },
    ],
  },
  {
    type: "chip",
    name: "Chip",
    category: "primitives",
    description: "Small tag or label element",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        description: "Chip label ({ literalString } or { path })",
      },
      {
        name: "variant",
        type: "'default' | 'primary'",
        description: "Chip style",
        default: "default",
      },
    ],
  },
  {
    type: "avatar",
    name: "Avatar",
    category: "primitives",
    description: "User avatar image or fallback",
    props: [
      { name: "src", type: "string", description: "Image URL" },
      {
        name: "fallback",
        type: "string",
        description: "Initials to show when no image",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg' | 'xl'",
        description: "Avatar size",
        default: "md",
      },
    ],
  },
  {
    type: "alert",
    name: "Alert",
    category: "primitives",
    description:
      "Alert message. ⚠️ Does NOT support text prop - use title (required) + description",
    props: [
      { name: "title", type: "string", description: "Alert title" },
      {
        name: "description",
        type: "string",
        description: "Alert message content",
      },
      {
        name: "variant",
        type: "'default' | 'success' | 'warning' | 'error'",
        description: "Alert style",
        default: "default",
      },
    ],
  },
  {
    type: "card",
    name: "Card",
    category: "primitives",
    description: "Container card with border and shadow",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references ({ explicitList } or string)",
      },
      {
        name: "child",
        type: "string",
        description: "Single child component ID",
      },
      {
        name: "className",
        type: "string",
        description: "Additional CSS classes",
      },
    ],
  },
  {
    type: "input",
    name: "Input",
    category: "primitives",
    description: "Text input field",
    props: [
      { name: "label", type: "string", description: "Input label" },
      { name: "placeholder", type: "string", description: "Placeholder text" },
      { name: "value", type: "string", description: "Input value" },
      {
        name: "type",
        type: "'text' | 'password' | 'email' | 'number'",
        description: "Input type",
        default: "text",
      },
      { name: "disabled", type: "boolean", description: "Disable the input" },
      { name: "required", type: "boolean", description: "Mark as required" },
    ],
  },
  {
    type: "textarea",
    name: "Textarea",
    category: "primitives",
    description: "Multi-line text input",
    props: [
      { name: "label", type: "string", description: "Textarea label" },
      { name: "placeholder", type: "string", description: "Placeholder text" },
      {
        name: "rows",
        type: "number",
        description: "Number of visible rows",
        default: "3",
      },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the textarea",
      },
    ],
  },
  {
    type: "checkbox",
    name: "Checkbox",
    category: "primitives",
    description: "Checkbox input",
    props: [
      { name: "label", type: "string", description: "Checkbox label" },
      { name: "checked", type: "boolean", description: "Checked state" },
      {
        name: "disabled",
        type: "boolean",
        description: "Disable the checkbox",
      },
    ],
  },
  {
    type: "switch",
    name: "Switch",
    category: "primitives",
    description: "Toggle switch",
    props: [
      { name: "label", type: "string", description: "Switch label" },
      { name: "checked", type: "boolean", description: "On/off state" },
      { name: "disabled", type: "boolean", description: "Disable the switch" },
    ],
  },
  {
    type: "select",
    name: "Select",
    category: "primitives",
    description: "Dropdown select menu",
    props: [
      { name: "label", type: "string", description: "Select label" },
      { name: "placeholder", type: "string", description: "Placeholder text" },
      { name: "value", type: "string | number", description: "Selected value" },
      {
        name: "options",
        type: "{ label: string; value: string | number }[]",
        required: true,
        description: "Dropdown options",
      },
      { name: "disabled", type: "boolean", description: "Disable the select" },
      { name: "required", type: "boolean", description: "Mark as required" },
      {
        name: "size",
        type: "'sm' | 'md'",
        description: "Select size",
        default: "md",
      },
      {
        name: "defaultValue",
        type: "string | number",
        description: "Default value",
      },
    ],
  },
  {
    type: "combobox",
    name: "Combobox",
    category: "primitives",
    description: "Searchable dropdown selection",
    props: [
      { name: "placeholder", type: "string", description: "Placeholder text" },
      {
        name: "options",
        type: "{ label: string; value: string }[]",
        required: true,
        description: "Options list",
      },
      {
        name: "value",
        type: "string | string[]",
        description: "Selected value(s)",
      },
      {
        name: "multiple",
        type: "boolean",
        description: "Allow multiple selection",
      },
      {
        name: "searchable",
        type: "boolean",
        description: "Enable search",
        default: "true",
      },
      { name: "disabled", type: "boolean", description: "Disable input" },
    ],
  },
  {
    type: "radio-group",
    name: "RadioGroup",
    category: "primitives",
    description: "Group of radio buttons",
    props: [
      { name: "name", type: "string", description: "Form field name" },
      { name: "value", type: "string", description: "Selected value" },
      {
        name: "defaultValue",
        type: "string",
        description: "Default selected value",
      },
      { name: "disabled", type: "boolean", description: "Disable all items" },
      {
        name: "children",
        type: "A2UIChildRef",
        description: "radio-group-item children",
      },
    ],
  },
  {
    type: "radio-group-item",
    name: "RadioGroupItem",
    category: "primitives",
    description: "Single radio option",
    usesTextProp: true,
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Option value",
      },
      {
        name: "text",
        type: "A2UITextValue",
        description: "Label text",
      },
      { name: "disabled", type: "boolean", description: "Disable this option" },
    ],
  },
  {
    type: "slider",
    name: "Slider",
    category: "primitives",
    description: "Range slider",
    props: [
      { name: "label", type: "string", description: "Slider label" },
      {
        name: "value",
        type: "number | [number, number]",
        description: "Current value",
      },
      {
        name: "min",
        type: "number",
        description: "Minimum value",
        default: "0",
      },
      {
        name: "max",
        type: "number",
        description: "Maximum value",
        default: "100",
      },
      {
        name: "step",
        type: "number",
        description: "Step increment",
        default: "1",
      },
      {
        name: "showValue",
        type: "boolean",
        description: "Display value next to label",
      },
      { name: "disabled", type: "boolean", description: "Disable slider" },
    ],
  },
  {
    type: "link",
    name: "Link",
    category: "primitives",
    description: "Hyperlink element",
    usesTextProp: true,
    props: [
      {
        name: "text",
        type: "A2UITextValue",
        description: "Link text ({ literalString } or { path })",
      },
      { name: "href", type: "string", required: true, description: "Link URL" },
    ],
  },
  {
    type: "spinner",
    name: "Spinner",
    category: "primitives",
    description: "Loading spinner indicator",
    props: [
      {
        name: "size",
        type: "'sm' | 'md' | 'lg'",
        description: "Spinner size",
        default: "md",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LAYOUT
  // ─────────────────────────────────────────────────────────────
  {
    type: "flex",
    name: "Flex",
    category: "layout",
    description: "Flexbox container for horizontal/vertical layouts",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      {
        name: "direction",
        type: "'row' | 'column'",
        description: "Flex direction",
        default: "row",
      },
      {
        name: "gap",
        type: "number",
        description: "Gap between children (4px increments)",
      },
      {
        name: "align",
        type: "'flex-start' | 'center' | 'flex-end' | 'stretch'",
        description: "Align items",
      },
      {
        name: "justify",
        type: "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'",
        description: "Justify content",
      },
      { name: "wrap", type: "boolean", description: "Allow wrapping" },
    ],
  },
  {
    type: "stack",
    name: "Stack",
    category: "layout",
    description: "Vertical stack layout (shorthand for flex column)",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      {
        name: "gap",
        type: "number",
        description: "Gap between children (4px increments)",
      },
    ],
  },
  {
    type: "grid",
    name: "Grid",
    category: "layout",
    description: "CSS Grid layout",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      {
        name: "columns",
        type: "number | string",
        description: "Number of columns or CSS grid template (e.g., '1fr 2fr')",
      },
      {
        name: "gap",
        type: "number",
        description: "Gap between cells (4px increments)",
      },
    ],
  },
  {
    type: "container",
    name: "Container",
    category: "layout",
    description: "Centered container with max-width",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      {
        name: "size",
        type: "'sm' | 'md' | 'lg' | 'xl'",
        description: "Max width size",
        default: "lg",
      },
    ],
  },
  {
    type: "switcher",
    name: "Switcher",
    category: "layout",
    description: "Responsive layout that switches between row and column",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      {
        name: "threshold",
        type: "string",
        description: "Breakpoint for switching (CSS value)",
      },
      { name: "gap", type: "number", description: "Gap between children" },
    ],
  },
  {
    type: "box",
    name: "Box",
    category: "layout",
    description: "Generic container div",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
      { name: "className", type: "string", description: "CSS classes" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────────
  {
    type: "tabs",
    name: "Tabs",
    category: "navigation",
    description: "Tab container",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "tabs-list and tabs-body children",
      },
      {
        name: "defaultValue",
        type: "string",
        description: "Initially active tab value",
      },
    ],
  },
  {
    type: "tabs-list",
    name: "TabsList",
    category: "navigation",
    description: "Container for tab triggers",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "tabs-trigger children",
      },
    ],
  },
  {
    type: "tabs-trigger",
    name: "TabsTrigger",
    category: "navigation",
    description: "Tab button",
    usesTextProp: true,
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Tab identifier",
      },
      { name: "text", type: "A2UITextValue", description: "Tab label" },
    ],
  },
  {
    type: "tabs-body",
    name: "TabsBody",
    category: "navigation",
    description: "Container for tab content panels",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "tabs-content children",
      },
    ],
  },
  {
    type: "tabs-content",
    name: "TabsContent",
    category: "navigation",
    description: "Tab content panel",
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Matching tab value",
      },
      {
        name: "child",
        type: "string",
        description: "Single child component ID",
      },
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Child component references",
      },
    ],
  },
  {
    type: "breadcrumbs",
    name: "Breadcrumbs",
    category: "navigation",
    description: "Breadcrumb navigation",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "breadcrumb-item children",
      },
    ],
  },
  {
    type: "breadcrumb-item",
    name: "BreadcrumbItem",
    category: "navigation",
    description: "Single breadcrumb link",
    usesTextProp: true,
    props: [
      { name: "text", type: "A2UITextValue", description: "Breadcrumb label" },
      {
        name: "href",
        type: "string",
        description: "Link URL (omit for current page)",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // FEEDBACK
  // ─────────────────────────────────────────────────────────────
  {
    type: "progress-bar",
    name: "ProgressBar",
    category: "feedback",
    description: "Progress indicator bar",
    props: [
      {
        name: "value",
        type: "number",
        required: true,
        description: "Progress value (0-100)",
      },
      {
        name: "variant",
        type: "'default' | 'success' | 'warning' | 'error'",
        description: "Bar color",
        default: "default",
      },
    ],
  },
  {
    type: "skeleton",
    name: "Skeleton",
    category: "feedback",
    description: "Loading placeholder",
    props: [
      { name: "width", type: "string | number", description: "Skeleton width" },
      {
        name: "height",
        type: "string | number",
        description: "Skeleton height",
      },
    ],
  },
  {
    type: "tooltip",
    name: "Tooltip",
    category: "feedback",
    description: "Hover tooltip",
    props: [
      {
        name: "content",
        type: "string",
        required: true,
        description: "Tooltop content text",
      },
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Trigger element",
      },
      {
        name: "placement",
        type: "'top' | 'bottom'",
        description: "Tooltip position",
        default: "top",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DATA DISPLAY
  // ─────────────────────────────────────────────────────────────
  {
    type: "slat",
    name: "Slat",
    category: "data-display",
    description:
      "List item with label and secondary text. ⚠️ Does NOT support text prop - use label + secondaryLabel",
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: "Primary label",
      },
      { name: "secondaryLabel", type: "string", description: "Secondary text" },
      {
        name: "variant",
        type: "'default' | 'success' | 'warning' | 'danger'",
        description: "Status color",
        default: "default",
      },
    ],
  },
  {
    type: "accordion",
    name: "Accordion",
    category: "data-display",
    description: "Collapsible content sections",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "accordion-item children",
      },
      {
        name: "type",
        type: "'single' | 'multiple'",
        description: "Allow single or multiple open",
        default: "single",
      },
      {
        name: "defaultValue",
        type: "string | string[]",
        description: "Initially open item(s)",
      },
    ],
  },
  {
    type: "accordion-item",
    name: "AccordionItem",
    category: "data-display",
    description: "Single accordion section",
    props: [
      {
        name: "value",
        type: "string",
        required: true,
        description: "Item identifier",
      },
      {
        name: "trigger",
        type: "string",
        required: true,
        description: "Header text",
      },
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Content children",
      },
    ],
  },
  {
    type: "chart",
    name: "Chart",
    category: "data-display",
    description: "Data visualization chart",
    props: [
      {
        name: "type",
        type: "'line' | 'area' | 'bar'",
        required: true,
        description: "Chart type",
      },
      {
        name: "data",
        type: "object[]",
        required: true,
        description: "Chart data array",
      },
      {
        name: "xKey",
        type: "string",
        required: true,
        description: "Data key for X axis",
      },
      {
        name: "yKey",
        type: "string",
        required: true,
        description: "Data key for Y axis",
      },
      { name: "title", type: "string", description: "Chart title" },
      { name: "subtitle", type: "string", description: "Chart subtitle" },
    ],
  },
  {
    type: "image",
    name: "Image",
    category: "data-display",
    description: "Image element",
    props: [
      { name: "src", type: "string", required: true, description: "Image URL" },
      { name: "alt", type: "string", required: true, description: "Alt text" },
    ],
  },
  {
    type: "table",
    name: "Table",
    category: "data-display",
    description: "Data table with sorting, filtering, and pagination",
    props: [
      {
        name: "data",
        type: "object[]",
        required: true,
        description: "Table data rows",
      },
      {
        name: "columns",
        type: "string[] | ColumnDef[]",
        required: true,
        description:
          "Column definitions. Can be simple strings (e.g., ['Name', 'Age']) or full ColumnDef objects",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────
  {
    type: "action-row",
    name: "ActionRow",
    category: "actions",
    description: "Row of action buttons",
    props: [
      {
        name: "children",
        type: "A2UIChildRef",
        description: "Button children",
      },
    ],
  },
  {
    type: "split-button",
    name: "SplitButton",
    category: "actions",
    description: "Button with dropdown menu",
    props: [
      {
        name: "options",
        type: "{ label: string; onClick?: () => void }[]",
        required: true,
        description: "Dropdown options",
      },
    ],
  },
];

/**
 * Get component types grouped by category
 */
export function getComponentsByCategory(): Record<
  string,
  ComponentDescriptor[]
> {
  const grouped: Record<string, ComponentDescriptor[]> = {};
  for (const component of componentCatalog) {
    if (!grouped[component.category]) {
      grouped[component.category] = [];
    }
    grouped[component.category].push(component);
  }
  return grouped;
}

/**
 * Get a flat list of all component type keys
 */
export function getComponentTypes(): string[] {
  return componentCatalog.map((c) => c.type);
}

/**
 * Look up a component by type
 */
export function getComponent(type: string): ComponentDescriptor | undefined {
  return componentCatalog.find((c) => c.type === type.toLowerCase());
}

/**
 * Generate JSON catalog for A2UI catalogId endpoint
 */
export function getCatalogJSON(): string {
  return JSON.stringify(
    {
      version: "1.0",
      designSystem: "doom",
      components: componentCatalog,
    },
    null,
    2,
  );
}
