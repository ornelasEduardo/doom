"use client";

import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { MobileOverlayProps } from "../../types";
import styles from "./MobileOverlay.module.scss";

export function MobileOverlay({
  children,
  isOpen,
  onClose,
}: MobileOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
      <aside
        aria-label="Sidebar navigation"
        aria-modal="true"
        className={clsx(styles.mobilePanel, isOpen && styles.isOpen)}
        role="dialog"
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
