"use client";
import clsx from "clsx";
import { X } from "lucide-react";
import React, { useEffect, useId, useRef } from "react";

import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ThemedPortal } from "../../styles/theming/ThemedPortal";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { Flex, Stack } from "../Layout/Layout";
import styles from "./Modal.module.scss";

interface ModalProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  classNames?: ThemeClassNames<"Modal">;
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "solid";
}

const ModalContext = React.createContext<{
  onClose: () => void;
  titleId?: string;
  variant: "default" | "solid";
}>({
  onClose: () => {},
  variant: "default",
});

interface ModalHeaderProps {
  classNames?: ThemeClassNames<"Modal">;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

function ModalHeader({
  classNames,
  children,
  className,
  id,
}: ModalHeaderProps) {
  const doomPart = useThemeParts("Modal", classNames, {});

  const { onClose, titleId } = React.useContext(ModalContext);

  return (
    <Flex
      align="center"
      {...doomPart("header", { className: clsx(styles.header, className) })}
      justify="space-between"
    >
      <div
        {...doomPart("headerContent", { className: styles.headerContent })}
        id={id || titleId}
      >
        {children}
      </div>
      <Button
        aria-label="Close modal"
        {...doomPart("closeButton", { className: styles.closeButton })}
        size="sm"
        variant="danger"
        onClick={onClose}
      >
        <ThemedIcon icon={X} iconName="close" size={20} strokeWidth={2.5} />
      </Button>
    </Flex>
  );
}

function ModalBody({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Modal">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Modal", classNames, {});

  return (
    <div {...doomPart("body", { className: clsx(styles.body, className) })}>
      {children}
    </div>
  );
}

function ModalFooter({
  classNames,
  children,
  className,
}: {
  classNames?: ThemeClassNames<"Modal">;
  children: React.ReactNode;
  className?: string;
}) {
  const doomPart = useThemeParts("Modal", classNames, {});

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

function ModalInternal({
  classNames,
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  style,
  variant = "default",
  ...props
}: ModalProps) {
  const doomPart = useOwnedThemeParts("Modal", classNames, {
    variant: variant,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!mounted) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <ThemePartsBoundary
      classNames={classNames}
      component="Modal"
      visual={{ variant }}
    >
      {
        <ThemedPortal surface={variant === "solid" ? "solid" : undefined}>
          {
            <ModalContext.Provider value={{ onClose, titleId, variant }}>
              <div
                ref={overlayRef}
                {...doomPart("root", {
                  className: clsx(
                    styles.overlay,
                    isOpen && styles.isOpen,
                    className,
                  ),
                })}
                style={style}
                onClick={handleOverlayClick}
              >
                <div
                  {...doomPart("contentContainer", {
                    className: styles.contentContainer,
                  })}
                >
                  <div
                    aria-label={
                      props["aria-label"] ||
                      (!title && !props["aria-labelledby"]
                        ? "Modal Window"
                        : undefined)
                    }
                    aria-labelledby={title ? titleId : props["aria-labelledby"]}
                    aria-modal="true"
                    role="dialog"
                    {...props}
                  >
                    <Card
                      {...doomPart("modalCard", {
                        className: clsx(styles.modalCard, styles[variant]),
                      })}
                      style={{ padding: 0, overflow: "hidden" }}
                    >
                      {title ? (
                        <>
                          <ModalHeader>{title}</ModalHeader>
                          <Stack
                            {...doomPart("modalContent", {
                              className: styles.modalContent,
                            })}
                            gap={0}
                          >
                            <ModalBody>{children}</ModalBody>
                            {footer && <ModalFooter>{footer}</ModalFooter>}
                          </Stack>
                        </>
                      ) : (
                        children
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            </ModalContext.Provider>
          }
        </ThemedPortal>
      }
    </ThemePartsBoundary>
  );
}

export const Modal = Object.assign(ModalInternal, {
  Root: ModalInternal,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
