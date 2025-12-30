"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import styles from "./Popover.module.scss";

interface PopoverProps {
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
    | "top-center";
  offset?: number;
}

export function Popover({
  trigger,
  content,
  isOpen,
  onClose,
  placement = "bottom-start",
  offset = 8,
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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

    // Edge Config
    const padding = 16;

    const isTop = placement.startsWith("top");

    if (isTop) {
      top = triggerRect.top - contentRect.height - offset;
      origin = "bottom";
      if (top < 0) {
        top = triggerRect.bottom + offset;
        origin = "top";
      }
    } else {
      top = triggerRect.bottom + offset;
      origin = "top";
      if (top + contentRect.height > viewportHeight) {
        top = triggerRect.top - contentRect.height - offset;
        origin = "bottom";
        if (top < 0) {
          top = padding;
        }
      }
    }

    // Vertical Clamping (Fail-safe)
    if (top < padding) {
      top = padding;
    }
    if (top + contentRect.height > viewportHeight - padding) {
      top = viewportHeight - contentRect.height - padding;
    }

    const align = placement.split("-")[1];

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

    // Horizontal Clamping
    if (left + contentRect.width > viewportWidth - padding) {
      left = viewportWidth - contentRect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    setPosition({ top, left });
    setTransformOrigin(origin);
  }, [isOpen, placement, offset]);

  // Use useLayoutEffect for layout measurements to prevent flash
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

  // Handle click outside
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <div ref={triggerRef} className={styles.triggerWrapper}>
        {trigger}
      </div>
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={contentRef}
            className={styles.popover}
            style={{
              top: position.top,
              left: position.left,
              transformOrigin: transformOrigin,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
