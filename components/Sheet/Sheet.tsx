"use client";
import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePresence } from "../../hooks/usePresence";
import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ThemedPortal } from "../../styles/theming/ThemedPortal";
import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Sheet.module.scss";

// A sheet may overlap another sheet while changing workflows. Preserve the host's lock.
const scrollLocks = new WeakMap<
  Document,
  { count: number; overflow: string }
>();
function lockScroll(document: Document) {
  const lock = scrollLocks.get(document) ?? {
    count: 0,
    overflow: document.body.style.overflow,
  };
  lock.count += 1;
  scrollLocks.set(document, lock);
  document.body.style.overflow = "hidden";
  return () => {
    lock.count -= 1;
    if (!lock.count) {
      document.body.style.overflow = lock.overflow;
      scrollLocks.delete(document);
    }
  };
}

const SheetContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
  variant: "default" | "solid";
  handlePointerDown: (e: React.PointerEvent) => void;
}>({
  onClose: () => {},
  variant: "default",
  handlePointerDown: () => {},
});

interface SheetHeaderProps {
  classNames?: ThemeClassNames<"Sheet">;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SheetHeader({
  classNames,
  children,
  className,
  id,
}: SheetHeaderProps) {
  const doomPart = useThemeParts("Sheet", classNames, {});

  const { onClose, titleId, handlePointerDown } =
    React.useContext(SheetContext);

  return (
    <div
      {...doomPart("header", { className: clsx(styles.header, className) })}
      onPointerDown={handlePointerDown}
    >
      <div {...doomPart("handleBar", { className: styles.handleBar })} />
      <Flex
        align="center"
        {...doomPart("headerBody", { className: styles.headerBody })}
        justify="space-between"
      >
        <div
          {...doomPart("headerContent", { className: styles.headerContent })}
          id={id || titleId}
        >
          {children}
        </div>
        <Button
          aria-label="Close sheet"
          size="sm"
          variant="danger"
          onClick={onClose}
        >
          <ThemedIcon icon={X} iconName="close" size={24} />
        </Button>
      </Flex>
    </div>
  );
}

export function SheetBody({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Sheet">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Sheet", classNames, {});

  return (
    <div
      {...doomPart("content", { className: clsx(styles.content, className) })}
    >
      {children}
    </div>
  );
}

export function SheetFooter({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Sheet">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Sheet", classNames, {});

  return (
    <Flex
      align="center"
      {...doomPart("footer", { className: clsx(styles.footer, className) })}
      gap={4}
      justify="flex-end"
    >
      {children}
    </Flex>
  );
}

interface SheetProps {
  classNames?: ThemeClassNames<"Sheet">;
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "solid";
  className?: string;
}

function SheetInternal({
  classNames,
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = "default",
  className,
}: SheetProps) {
  const doomPart = useOwnedThemeParts("Sheet", classNames, {
    variant: variant,
  });

  const reactId = React.useId();
  const titleId = `sheet-title-${reactId}`;
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Reset drag overrides before presence measures the exit transition.
  useLayoutEffect(() => {
    if (!isOpen) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      isDragging.current = false;
    }
    if (!isOpen && panelRef.current) {
      panelRef.current.style.transform = "";
      panelRef.current.style.transition = "";
    }
  }, [isOpen]);

  const present = usePresence(isOpen, panelRef);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (present) {
      return lockScroll(document);
    }
  }, [present]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (
      !isOpen ||
      isDragging.current ||
      !panelRef.current ||
      e.button !== 0 ||
      (e.target instanceof Element &&
        e.target.closest("button,input,select,textarea,a,[role=button]"))
    ) {
      return;
    }
    cleanupRef.current?.();
    const pointerId = e.pointerId;
    isDragging.current = true;
    startY.current = e.clientY;

    const onMove = (moveEvent: PointerEvent) => {
      if (
        moveEvent.pointerId !== pointerId ||
        !isDragging.current ||
        !panelRef.current
      ) {
        return;
      }
      const delta = Math.max(0, moveEvent.clientY - startY.current);

      panelRef.current.style.transition = "none";
      panelRef.current.style.transform = `translateY(${delta}px)`;
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }
      isDragging.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      cleanupRef.current = null;

      if (!panelRef.current) {
        return;
      }

      const delta = upEvent.clientY - startY.current;
      panelRef.current.style.transition = "";
      panelRef.current.style.transform = "";
      if (upEvent.type !== "pointercancel" && delta > 150) {
        onClose();
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);

    cleanupRef.current = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted || !present) {
    return null;
  }

  return (
    <ThemePartsBoundary
      classNames={classNames}
      component="Sheet"
      visual={{ variant }}
    >
      {
        <ThemedPortal surface={variant === "solid" ? "solid" : undefined}>
          {
            <SheetContext.Provider
              value={{ onClose, titleId, variant, handlePointerDown }}
            >
              <div
                aria-hidden="true"
                {...doomPart("root", {
                  className: clsx(styles.overlay, isOpen && styles.isOpen),
                })}
                onClick={onClose}
              />
              <div
                ref={panelRef}
                {...(!isOpen
                  ? { inert: true, "aria-hidden": true as const }
                  : {})}
                aria-label={!title ? "Sheet" : undefined}
                aria-labelledby={title ? titleId : undefined}
                aria-modal={isOpen ? "true" : undefined}
                {...doomPart("panel", {
                  className: clsx(
                    styles.panel,
                    styles[variant],
                    isOpen && styles.isOpen,
                    className,
                  ),
                })}
                role="dialog"
              >
                {title ? (
                  <>
                    <SheetHeader>{title}</SheetHeader>
                    <SheetBody>{children}</SheetBody>
                    {footer && <SheetFooter>{footer}</SheetFooter>}
                  </>
                ) : (
                  children
                )}
              </div>
            </SheetContext.Provider>
          }
        </ThemedPortal>
      }
    </ThemePartsBoundary>
  );
}

export const Sheet = Object.assign(SheetInternal, {
  Root: SheetInternal,
  Header: SheetHeader,
  Body: SheetBody,
  Footer: SheetFooter,
});
