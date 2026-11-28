"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { usePresence } from "../../hooks/usePresence";
import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import {
  OverlayPortalContext,
  ThemedPortal,
} from "../../styles/theming/ThemedPortal";
import styles from "./Popover.module.scss";

interface PopoverProps {
  classNames?: ThemeClassNames<"Popover">;
  trigger: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  placement?:
    | "bottom-start"
    | "bottom-end"
    | "bottom-center"
    | "top-start"
    | "top-end"
    | "top-center"
    | "right-start"
    | "right-end"
    | "right-center"
    | "left-start"
    | "left-end"
    | "left-center";
  offset?: number;
}

export function Popover({
  classNames,
  trigger,
  content,
  isOpen,
  onClose,
  placement = "bottom-start",
  offset = 8,
}: PopoverProps) {
  const doomPart = useThemeParts("Popover", classNames, {});

  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const present = usePresence(isOpen, contentRef);
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [transformOrigin, setTransformOrigin] = useState("top left");

  const updatePosition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let origin = "top center";

    const padding = 16;
    const side = placement.split("-")[0];
    const align = placement.split("-")[1];

    if (side === "top") {
      top = triggerRect.top - contentRect.height - offset;
      origin = "bottom";
      if (top < 0) {
        top = triggerRect.bottom + offset;
        origin = "top";
      }
    } else if (side === "bottom") {
      top = triggerRect.bottom + offset;
      origin = "top";
      if (top + contentRect.height > viewportHeight) {
        top = triggerRect.top - contentRect.height - offset;
        origin = "bottom";
        if (top < 0) {
          top = padding;
        }
      }
    } else if (side === "right") {
      left = triggerRect.right + offset;
      origin = "left";
      if (left + contentRect.width > viewportWidth) {
        left = triggerRect.left - contentRect.width - offset;
        origin = "right";
        if (left < 0) {
          left = padding;
        }
      }
    } else if (side === "left") {
      left = triggerRect.left - contentRect.width - offset;
      origin = "right";
      if (left < 0) {
        left = triggerRect.right + offset;
        origin = "left";
      }
    }

    if (side === "top" || side === "bottom") {
      if (align === "start") {
        left = triggerRect.left;
        origin += " left";
      } else if (align === "end") {
        left = triggerRect.right - contentRect.width;
        origin += " right";
      } else {
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        origin += " center";
      }
    } else {
      if (align === "start") {
        top = triggerRect.top;
        origin = "top " + origin;
      } else if (align === "end") {
        top = triggerRect.bottom - contentRect.height;
        origin = "bottom " + origin;
      } else {
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        origin = "center " + origin;
      }
    }

    if (top < padding) {
      top = padding;
    }
    if (top + contentRect.height > viewportHeight - padding) {
      top = viewportHeight - contentRect.height - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (left + contentRect.width > viewportWidth - padding) {
      left = viewportWidth - contentRect.width - padding;
    }

    setPosition({ top, left });
    setTransformOrigin(origin);
  }, [isOpen, placement, offset]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  function handleEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || event.defaultPrevented || !isOpen) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    triggerRef.current
      ?.querySelector<HTMLElement>("button,a[href],[tabindex]")
      ?.focus();
    onClose();
  }

  return (
    <>
      <div
        ref={triggerRef}
        onKeyDown={handleEscape}
        {...doomPart("triggerWrapper", { className: styles.triggerWrapper })}
      >
        {trigger}
      </div>
      {present && typeof document !== "undefined" && (
        <ThemedPortal>
          {
            <div
              ref={contentRef}
              aria-hidden={!isOpen || undefined}
              data-state={isOpen ? "open" : "closed"}
              inert={!isOpen || undefined}
              onKeyDown={handleEscape}
              {...doomPart("root", { className: styles.popover })}
              style={{
                top: position.top,
                left: position.left,
                transformOrigin: transformOrigin,
              }}
            >
              <div ref={setPortalHost}>
                <OverlayPortalContext.Provider value={portalHost}>
                  {content}
                </OverlayPortalContext.Provider>
              </div>
            </div>
          }
        </ThemedPortal>
      )}
    </>
  );
}
