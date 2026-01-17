/**
 * A2UI Type Definitions
 *
 * This module exports all A2UI types for use by consumers.
 *
 * @see https://a2ui.org/reference/messages/
 */

// Message envelope types
export type {
  A2UIMessage,
  A2UIMessageType,
  BeginRenderingMessage,
  DataModelUpdateMessage,
  DeleteSurfaceMessage,
  SurfaceUpdateMessage,
} from "./messages";

// Component types
export type {
  A2UIComponentEntry,
  A2UIComponentWrapper,
  ResolvedComponent,
  ResolvedNode,
} from "./components";

// Value types
export type { A2UIChildRef, A2UITextValue, DataModelEntry } from "./values";

// Type guards
export {
  isA2UITextValue,
  isExplicitList,
  isLiteralString,
  isPathReference,
} from "./values";
