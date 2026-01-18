import React, { useLayoutEffect } from "react";

import { useSidebarContext } from "./context";
import { hasActiveChild } from "./utils";

export function useAutoExpand(id: string, children: React.ReactNode) {
  const { activeItem, expandSection } = useSidebarContext();

  useLayoutEffect(() => {
    if (!activeItem) {
      return;
    }

    if (hasActiveChild(children, activeItem)) {
      expandSection(id);
    }
  }, [activeItem, children, expandSection, id]);
}
