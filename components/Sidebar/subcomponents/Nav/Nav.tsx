import clsx from "clsx";
import React from "react";

import { useThemeParts } from "../../../../styles/theming/parts";
import { Stack } from "../../../Layout/Layout";
import { SidebarNavProps } from "../../types";
import styles from "./Nav.module.scss";

export function Nav({ classNames, children, className }: SidebarNavProps) {
  const doomPart = useThemeParts("Sidebar", classNames, {});

  return (
    <nav
      aria-label="Sidebar navigation"
      {...doomPart("nav", { className: clsx(styles.nav, className) })}
    >
      <Stack gap={1}>{children}</Stack>
    </nav>
  );
}

Nav.displayName = "Nav";
