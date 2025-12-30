"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import React from "react";

import { Flex } from "../Layout/Layout";
import { Text } from "../Text/Text";
import styles from "./ActionRow.module.scss";

interface ActionRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
}

export function ActionRow({
  icon,
  title,
  description,
  onClick,
  className,
  ...props
}: ActionRowProps) {
  return (
    <Flex
      align="center"
      className={clsx(styles.actionRow, className)}
      gap={6}
      onClick={onClick}
      {...props}
    >
      <div className={styles.iconWrapper}>{icon}</div>
      <Flex direction="column" gap={1} style={{ flex: 1 }}>
        <Text variant="h6" weight="bold">
          {title}
        </Text>
        {description && (
          <Text color="muted" variant="small">
            {description}
          </Text>
        )}
      </Flex>
      <ChevronRight
        size={20}
        strokeWidth={2.5}
        style={{ color: "var(--muted-foreground)" }}
      />
    </Flex>
  );
}
