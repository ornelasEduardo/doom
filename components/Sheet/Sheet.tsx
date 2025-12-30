"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
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
        <div className={styles.header}>
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
