import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { Button } from "../../../Button/Button";
import { Text } from "../../../Text/Text";
import { useSidebarContext } from "../../context";
import { SidebarMobileTriggerProps } from "../../types";
import styles from "./MobileTrigger.module.scss";

export function MobileTrigger({
  classNames,
  children,
  className,
}: SidebarMobileTriggerProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

  const { setMobileOpen } = useSidebarContext();

  return (
    <Button
      aria-label="Open sidebar"
      {...doomPart("mobileTrigger", {
        className: clsx(styles.mobileTrigger, className),
      })}
      size="sm"
      variant="ghost"
      onClick={() => setMobileOpen(true)}
    >
      {children || <Text>☰</Text>}
    </Button>
  );
}
