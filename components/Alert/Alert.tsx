"use client";

import clsx from "clsx";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import React from "react";

import { Text } from "../Text/Text";
import styles from "./Alert.module.scss";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  variant?: AlertVariant;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

export function Alert({
  variant = "info",
  title,
  description,
  icon,
  className,
}: AlertProps) {
  const IconComponent = icons[variant];

  return (
    <div
      className={clsx(styles.alert, styles[variant], className)}
      role="alert"
    >
      <div className={clsx(styles.iconWrapper, styles[variant])}>
        {icon || <IconComponent size={20} strokeWidth={2.5} />}
      </div>
      <div className={styles.content}>
        <Text as="h1" className={styles.title} variant="h5">
          {title}
        </Text>
        {description && (
          <Text as="p" className={styles.description} variant="body">
            {description}
          </Text>
        )}
      </div>
    </div>
  );
}
