/**
 * A2UI Module Exports
 *
 * This module provides the A2UI renderer and supporting utilities
 * for rendering AI-generated UI based on the A2UI protocol.
 *
 * @see https://a2ui.org/
 */

// Main component
export type { RendererProps as A2UIProps } from "./Renderer";
export { Renderer as A2UI } from "./Renderer";

// Types for consumers
export * from "./types";

// Utilities for advanced usage
export { dataModelToObject, resolveTextValue, resolveTree } from "./utils";

// Component catalog for AI/LLM consumption
export {
  componentCatalog,
  type ComponentDescriptor,
  getCatalogJSON,
  getComponent,
  getComponentsByCategory,
  getComponentTypes,
  type PropDescriptor,
} from "./catalog";

// Note: promptUtils is NOT exported from the package because it uses
// Vite-specific ?raw imports for markdown files. It's available for
// internal Storybook use only. Import directly if needed:
// import { getA2UISystemPrompt } from "doom-design-system/components/A2UI/promptUtils";
