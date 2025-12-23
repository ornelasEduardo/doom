import React from "react";
import styles from "./Slat.module.scss";
import { Text } from "../Text/Text";
import { Stack, Flex } from "../Layout/Layout";
import clsx from "clsx";

export interface SlatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main label (e.g. filename) */
  label: React.ReactNode;
  /** Secondary label (e.g. filesize) */
  secondaryLabel?: React.ReactNode;
  /** Icon/Graphics to display on the left */
  prependContent?: React.ReactNode;
  /** Content to display on the right (actions) */
  appendContent?: React.ReactNode;
  /** Variant of the slat */
  variant?: "default" | "danger" | "success";
}

export const Slat = React.forwardRef<HTMLDivElement, SlatProps>(
  (
    {
      label,
      secondaryLabel,
      prependContent,
      appendContent,
      variant = "default",
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={clsx(
          styles.slat,
          styles[variant],
          { [styles.hoverable]: onClick },
          className
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick(e as any);
          }
        }}
        {...props}
      >
        <Flex justify="space-between" align="center" gap="var(--spacing-sm)">
          <Flex
            gap="var(--spacing-sm)"
            align="center"
            style={{ flex: 1, minWidth: 0 }}
          >
            {prependContent && (
              <div className={styles.prepend}>{prependContent}</div>
            )}
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text className={styles.label}>{label}</Text>
              {secondaryLabel && (
                <Text variant="small" className={styles.secondaryLabel}>
                  {secondaryLabel}
                </Text>
              )}
            </Stack>
          </Flex>

          <Flex align="center" gap="var(--spacing-sm)">
            {appendContent && (
              <div className={styles.append}>{appendContent}</div>
            )}
          </Flex>
        </Flex>
      </div>
    );
  }
);

Slat.displayName = "Slat";
