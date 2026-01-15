// Global declarations for untyped modules

// Touch polyfill for mobile drag and drop support
declare module "@dragdroptouch/drag-drop-touch";

// Vite raw imports
declare module "*?raw" {
  const content: string;
  export default content;
}
