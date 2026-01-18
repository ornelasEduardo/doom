import { createContext, useContext } from "react";

import { SidebarContextValue } from "./types";

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within Sidebar");
  }
  return context;
}
