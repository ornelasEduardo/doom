"use client";
import clsx from "clsx";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { Text } from "../Text/Text";
import styles from "./Alert.module.scss";

export type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
  classNames?: ThemeClassNames<"Alert">;
  variant?: AlertVariant;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const icons = {
  info: { icon: Info, iconName: "info" },
  success: { icon: CheckCircle, iconName: "checkCircle2" },
  warning: { icon: AlertCircle, iconName: "alertTriangle" },
  error: { icon: XCircle, iconName: "xCircle" },
} as const;

export function Alert({
  classNames,
  variant = "info",
  title,
  description,
  icon,
  className,
}: AlertProps) {
  const doomPart = useThemeParts("Alert", classNames, { variant: variant });

  const statusIcon = icons[variant];

  return (
    <div
      {...doomPart("root", {
        className: clsx(styles.alert, styles[variant], className),
      })}
      role="alert"
    >
      <div
        {...doomPart("iconWrapper", {
          className: clsx(styles.iconWrapper, styles[variant]),
        })}
      >
        {icon || <ThemedIcon {...statusIcon} size={20} strokeWidth={2.5} />}
      </div>
      <div {...doomPart("content", { className: styles.content })}>
        <Text
          as="h1"
          {...doomPart("title", { className: styles.title })}
          variant="h5"
        >
          {title}
        </Text>
        {description && (
          <Text
            as="p"
            {...doomPart("description", { className: styles.description })}
            variant="body"
          >
            {description}
          </Text>
        )}
      </div>
    </div>
  );
}
