import clsx from "clsx";
import React from "react";

import { Button } from "../../../Button/Button";
import { Text } from "../../../Text/Text";
import { useSidebarContext } from "../../context";
import { SidebarMobileTriggerProps } from "../../types";
import styles from "./MobileTrigger.module.scss";

export function MobileTrigger({
  children,
  className,
}: SidebarMobileTriggerProps) {
  const { setMobileOpen } = useSidebarContext();

  return (
    <Button
      aria-label="Open sidebar"
      className={clsx(styles.mobileTrigger, className)}
      size="sm"
      variant="ghost"
      onClick={() => setMobileOpen(true)}
    >
      {children || <Text>☰</Text>}
    </Button>
  );
}
