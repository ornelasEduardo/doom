import examples from "../../.agent/skills/doom/a2ui/a2ui-examples.md?raw";
import principles from "../../.agent/skills/doom/a2ui/a2ui-principles.md?raw";
import cssVariables from "../../.agent/skills/doom/styles/css-variables.md?raw";
import utilities from "../../.agent/skills/doom/styles/utilities.md?raw";
import {
  type ComponentDescriptor,
  getComponentsByCategory,
  getComponentTypes,
} from "./catalog";

/**
 * Generates component reference documentation from the catalog
 */
function generateComponentReference(): string {
  const grouped = getComponentsByCategory();
  const sections: string[] = [];

  const categoryTitles: Record<string, string> = {
    primitives: "Primitives",
    layout: "Layout",
    navigation: "Navigation",
    feedback: "Feedback",
    "data-display": "Data Display",
    actions: "Actions",
  };

  for (const [category, components] of Object.entries(grouped)) {
    const title = categoryTitles[category] || category;
    const rows = components.map((c) => formatComponentRow(c)).join("\n");

    sections.push(`### ${title}

| Type | Key Props | Description |
|------|-----------|-------------|
${rows}`);
  }

  return sections.join("\n\n");
}

/**
 * Format a single component as a table row
 */
function formatComponentRow(component: ComponentDescriptor): string {
  const keyProps = component.props
    .filter(
      (p) =>
        p.required ||
        ["variant", "text", "children", "child", "gap", "columns"].includes(
          p.name,
        ),
    )
    .slice(0, 3)
    .map((p) => {
      if (p.type.includes("|")) {
        // Show enum options inline
        const options = p.type
          .replace(/'/g, "")
          .split(" | ")
          .slice(0, 3)
          .join("/");
        return `\`${p.name}\`: ${options}`;
      }
      return `\`${p.name}\``;
    })
    .join(", ");

  const usesText = component.usesTextProp ? " (uses `text` prop)" : "";

  return `| \`${component.type}\` | ${keyProps || "-"} | ${component.description}${usesText} |`;
}

/**
 * Generates the A2UI schema reference documentation
 */
function getSchemaReference(): string {
  return `
## A2UI Message Schema

A2UI uses a flat adjacency list format where components reference children by ID.

### Component Structure

\`\`\`json
{
  "surfaceId": "main",
  "components": [
    {
      "id": "unique-id",
      "component": {
        "component-type": {
          "propName": "value",
          "text": { "literalString": "Static text" },
          "children": { "explicitList": ["child-id-1", "child-id-2"] }
        }
      }
    }
  ]
}
\`\`\`

### Value Types

| Type | Format | Example |
|------|--------|---------|
| Literal String | \`{ "literalString": "..." }\` | \`{ "literalString": "Hello" }\` |
| Data Binding | \`{ "path": "/..." }\` | \`{ "path": "/user/name" }\` |
| Single Child | \`"child-id"\` | \`"header-component"\` |
| Multiple Children | \`{ "explicitList": [...] }\` | \`{ "explicitList": ["a", "b"] }\` |

> **Note**: Components with \`usesTextProp: true\` receive their display text via the \`text\` prop, which the renderer automatically maps to React \`children\`.
`.trim();
}

/**
 * Generates the full A2UI system prompt for AI/LLM consumption.
 *
 * This prompt includes:
 * - A2UI schema reference
 * - Component catalog (auto-generated from catalog.ts)
 * - Design principles
 * - Available CSS utilities
 * - CSS variables
 * - Few-shot examples
 */
export const getA2UISystemPrompt = (): string => {
  return `
You are an expert UI generator for the Doom Design System.
Your goal is to generate valid A2UI JSON that perfectly matches the user's request.

# 1. A2UI Schema Reference
${getSchemaReference()}

# 2. Available Components

${generateComponentReference()}

# 3. Design Principles
${principles}

# 4. Available Utilities (Classes)
${utilities}

# 5. CSS Variables
${cssVariables}

# 6. Examples (Few-Shot)
${examples}

# Instructions
- Output ONLY valid JSON matching the A2UI schema.
- Use the adjacency list format with \`id\` and \`component\` wrapper.
- Use \`{ "literalString": "..." }\` for static text values.
- Use \`{ "path": "/..." }\` for data-bound values.
- Use \`{ "explicitList": [...] }\` for multiple children.
- Component types are lowercase (e.g., \`card\`, \`button\`, \`flex\`).
- Use the utilities for layout/spacing/sizing.
- Use CSS variables for custom styling in the \`style\` prop if needed.
`.trim();
};

/**
 * Returns just the list of available component types.
 * Useful for validation or autocomplete features.
 */
export { getComponentTypes as getAvailableComponentTypes };

/**
 * Re-export catalog utilities for consumers
 */
export {
  componentCatalog,
  getComponent,
  getComponentsByCategory,
} from "./catalog";
