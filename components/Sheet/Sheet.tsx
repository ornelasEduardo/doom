"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Sheet.module.scss";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "solid";
  className?: string;
}

export function Sheet({
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

  // Ensure strict cleanup on unmount
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
    <>
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
        <div className={styles.header} onPointerDown={handlePointerDown}>
          <div className={styles.handleBar} />
          <Flex
            align="center"
            className={styles.headerBody}
            justify="space-between"
          >
            {title && (
              <h2 className={styles.title} id={titleId}>
                {title}
              </h2>
            )}
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
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
