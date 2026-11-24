"use client";
import React, { useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Popover } from "../Popover/Popover";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  classNames?: ThemeClassNames<"Tooltip">;
  content: string;
  children: React.ReactNode;
  delay?: number;
  placement?: "top" | "bottom";
}

export function Tooltip({
  content,
  children,
  delay = 200,
  placement = "top",
}: TooltipProps) {
  const doomPart = useThemeParts("Tooltip", undefined, {});

  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const show = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hide = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  // Map simplified placement to Popover placement
  const popoverPlacement = placement === "top" ? "top-center" : "bottom-center";

  return (
    <Popover
      content={
        <div
          {...doomPart("tooltipBody", { className: styles.tooltipBody })}
          role="tooltip"
        >
          {content}
        </div>
      }
      isOpen={isVisible}
      offset={8}
      placement={popoverPlacement}
      trigger={
        <div
          {...doomPart("root", { className: styles.triggerWrapper })}
          onBlur={hide}
          onFocus={show}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {children}
        </div>
      }
      onClose={hide}
    />
  );
}
