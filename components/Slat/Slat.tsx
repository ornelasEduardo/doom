import clsx from "clsx";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Flex, Stack } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./Slat.module.scss";

export interface SlatProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"Slat">;
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
      classNames,
      label,
      secondaryLabel,
      prependContent,
      appendContent,
      variant = "default",
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const doomPart = useThemeParts("Slat", classNames, { variant: variant });

    return (
      <div
        ref={ref}
        {...doomPart("root", {
          className: clsx(
            styles.slat,
            styles[variant],
            { [styles.hoverable]: onClick },
            className,
          ),
        })}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick(e as any);
          }
        }}
        {...props}
      >
        <Flex align="center" gap={2} justify="space-between">
          <Flex align="center" gap={2} style={{ flex: 1, minWidth: 0 }}>
            {prependContent && (
              <div {...doomPart("prepend", { className: styles.prepend })}>
                {prependContent}
              </div>
            )}
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text {...doomPart("label", { className: styles.label })}>
                {label}
              </Text>
              {secondaryLabel && (
                <Text
                  {...doomPart("secondaryLabel", {
                    className: styles.secondaryLabel,
                  })}
                  variant="small"
                >
                  {secondaryLabel}
                </Text>
              )}
            </Stack>
          </Flex>

          <Flex align="center" gap={2}>
            {appendContent && (
              <div {...doomPart("append", { className: styles.append })}>
                {appendContent}
              </div>
            )}
          </Flex>
        </Flex>
      </div>
    );
  },
);

Slat.displayName = "Slat";
