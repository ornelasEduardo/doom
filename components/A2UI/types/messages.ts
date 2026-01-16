/**
 * A2UI Message Envelope Types
 *
 * These types represent the top-level message formats sent via JSONL
 * as defined in the A2UI specification.
 *
 * @see https://a2ui.org/reference/messages/
 */

import type { A2UIComponentEntry } from "./components";
import type { DataModelEntry } from "./values";

/**
 * Signals that a surface has enough information to perform initial render.
 * The client should buffer updates until receiving this message.
 */
export interface BeginRenderingMessage {
  beginRendering: {
    /** Unique surface identifier */
    surfaceId: string;
    /** ID of the root component to render */
    root: string;
    /** Optional URL of component catalog */
    catalogId?: string;
    /** Optional styling information */
    styles?: Record<string, unknown>;
  };
}

/**
 * Adds or updates components within a surface.
 */
export interface SurfaceUpdateMessage {
  surfaceUpdate: {
    /** Target surface identifier */
    surfaceId: string;
    /** List of components to add/update */
    components: A2UIComponentEntry[];
  };
}

/**
 * Updates the data model that components bind to.
 */
export interface DataModelUpdateMessage {
  dataModelUpdate: {
    /** Target surface identifier */
    surfaceId: string;
    /** Optional path to update (omit to replace entire model) */
    path?: string;
    /** Data entries to set */
    contents: DataModelEntry[];
  };
}

/**
 * Removes a surface and all its components and data.
 */
export interface DeleteSurfaceMessage {
  deleteSurface: {
    /** Surface to delete */
    surfaceId: string;
  };
}

/**
 * Union type representing any valid A2UI message.
 */
export type A2UIMessage =
  | BeginRenderingMessage
  | SurfaceUpdateMessage
  | DataModelUpdateMessage
  | DeleteSurfaceMessage;

/**
 * Message type discriminators for type narrowing.
 */
export type A2UIMessageType = keyof A2UIMessage;
