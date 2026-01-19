"use client";

import clsx from "clsx";
import React, { useMemo } from "react";

import { Flex } from "../../../Layout/Layout";
import { Text } from "../../../Text/Text";
import { useChartContext } from "../../context";
import { LegendItem } from "../../types";
import styles from "./Legend.module.scss";

export interface LegendProps {
  items?: LegendItem[] | ((items: LegendItem[]) => LegendItem[]);
  layout?: "horizontal" | "vertical";
  align?: "start" | "center" | "end";
  className?: string;
  style?: React.CSSProperties;
}

export function Legend({
  items,
  layout = "horizontal",
  align = "start",
  className,
  style,
}: LegendProps) {
  const { legendItems, type, render } = useChartContext();

  const contextItems = useMemo(() => {
    if (render || (type === "bar" && legendItems.length > 1)) {
      return legendItems;
    }

    return legendItems.slice(0, 1);
  }, [legendItems, type, render]);

  const activeItems =
    typeof items === "function" ? items(contextItems) : (items ?? contextItems);

  if (!activeItems?.length) {
    return null;
  }

  const isVertical = layout === "vertical";

  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
  };

  return (
    <Flex
      className={clsx(styles.legend, className)}
      gap={isVertical ? 2 : 4}
      style={{
        flexWrap: "wrap",
        flexDirection: isVertical ? "column" : "row",
        justifyContent: isVertical ? "flex-start" : alignMap[align],
        alignItems: isVertical ? alignMap[align] : "center",
        ...style,
      }}
    >
      {activeItems.map((item, index) => (
        <Flex
          key={item.label || index}
          align="center"
          className={styles.legendItem}
          gap={1}
        >
          <span
            className={styles.legendDot}
            style={{
              backgroundColor: item.color,
            }}
          />
          <Text className={styles.legendLabel} variant="small">
            {item.label}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
