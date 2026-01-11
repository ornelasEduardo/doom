"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Sheet.module.scss";

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
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function SheetHeader({ children, className, id }: SheetHeaderProps) {
  const { onClose, titleId, handlePointerDown } =
    React.useContext(SheetContext);

  return (
    <div
      className={clsx(styles.header, className)}
      onPointerDown={handlePointerDown}
    >
      <div className={styles.handleBar} />
      <Flex
        align="center"
        className={styles.headerBody}
        justify="space-between"
      >
        <div className={styles.headerContent} id={id || titleId}>
          {children}
        </div>
        <Button
          aria-label="Close sheet"
          size="sm"
          variant="danger"
          onClick={onClose}
        >
          <X size={24} />
        </Button>
      </Flex>
    </div>
  );
}

export function SheetBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx(styles.content, className)}>{children}</div>;
}

export function SheetFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Flex
      align="center"
      className={clsx(styles.footer, className)}
      gap={4}
      justify="flex-end"
    >
      {children}
    </Flex>
  );
}

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "solid";
  className?: string;
}

function SheetInternal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = "default",
  className,
}: SheetProps) {
  const reactId = React.useId();
  const titleId = `sheet-title-${reactId}`;
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen && panelRef.current) {
      panelRef.current.style.transform = "";
      panelRef.current.style.transition = "";
    }
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panelRef.current) {
      return;
    }
    isDragging.current = true;
    startY.current = e.clientY;

    const onMove = (moveEvent: PointerEvent) => {
      if (!isDragging.current || !panelRef.current) {
        return;
      }
      const delta = moveEvent.clientY - startY.current;
      if (delta < 0) {
        return;
      }

      panelRef.current.style.transition = "none";
      panelRef.current.style.transform = `translateY(${delta}px)`;
    };

    const onUp = (upEvent: PointerEvent) => {
      isDragging.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      cleanupRef.current = null;

      if (!panelRef.current) {
        return;
      }

      const delta = upEvent.clientY - startY.current;
      if (delta > 150) {
        onClose();
      } else {
        panelRef.current.style.transition = "";
        panelRef.current.style.transform = "";
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
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <SheetContext.Provider
      value={{ onClose, titleId, variant, handlePointerDown }}
    >
      <div
        aria-hidden="true"
        className={clsx(styles.overlay, isOpen && styles.isOpen)}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        aria-label={!title ? "Sheet" : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={clsx(
          styles.panel,
          styles[variant],
          isOpen && styles.isOpen,
          className,
        )}
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
    </SheetContext.Provider>,
    document.body,
  );
}

export const Sheet = Object.assign(SheetInternal, {
  Root: SheetInternal,
  Header: SheetHeader,
  Body: SheetBody,
  Footer: SheetFooter,
});
