"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Button } from "../Button/Button";
import { Flex } from "../Layout/Layout";
import styles from "./Sheet.module.scss";
import { X } from "lucide-react";

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
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={clsx(styles.overlay, isOpen && styles.isOpen)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          styles.panel,
          styles[variant],
          isOpen && styles.isOpen,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? "Sheet" : undefined}
      >
        <div className={styles.header}>
          <div className={styles.handleBar} />
          <Flex
            align="center"
            justify="space-between"
            className={styles.headerBody}
          >
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close sheet"
            >
              <X size={24} />
            </Button>
          </Flex>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>,
    document.body
  );
}
