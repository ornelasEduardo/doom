"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import styles from "./Drawer.module.scss";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: "default" | "solid";
}

export function Drawer({
  isOpen,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
  variant = "default",
}: DrawerProps) {
  const reactId = React.useId();
  const titleId = `drawer-title-${reactId}`;
  const [mounted, setMounted] = useState(false);

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
        aria-label={!title ? "Drawer" : undefined}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={clsx(
          styles.panel,
          styles[side],
          styles[variant],
          isOpen && styles.isOpen,
          className,
        )}
        role="dialog"
      >
        <div className={styles.header}>
          {title && (
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
          )}
          <Button
            aria-label="Close drawer"
            size="sm"
            variant="danger"
            onClick={onClose}
          >
            <X size={24} />
          </Button>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
