"use client";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { Flex } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./ActionRow.module.scss";

interface ActionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  classNames?: ThemeClassNames<"ActionRow">;
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

export function ActionRow({
  classNames,
  icon,
  title,
  description,
  onClick,
  className,
  ...props
}: ActionRowProps) {
  const doomPart = useThemeParts("ActionRow", classNames, {});

  return (
    <Flex
      align="center"
      {...doomPart("root", { className: clsx(styles.actionRow, className) })}
      gap={6}
      width="100%"
      onClick={onClick}
      {...props}
    >
      <div {...doomPart("iconWrapper", { className: styles.iconWrapper })}>
        {icon}
      </div>
      <Flex direction="column" gap={1} style={{ flex: 1, minWidth: 0 }}>
        <Text variant="h6" weight="bold">
          {title}
        </Text>
        {description && (
          <Text color="muted" variant="small">
            {description}
          </Text>
        )}
      </Flex>
      <ThemedIcon
        icon={ChevronRight}
        iconName="chevronRight"
        size={20}
        strokeWidth={2.5}
        style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
      />
    </Flex>
  );
}
