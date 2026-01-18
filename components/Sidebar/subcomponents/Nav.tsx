import clsx from "clsx";
import React from "react";

import { Stack } from "../../Layout/Layout";
import styles from "../Sidebar.module.scss";
import { SidebarNavProps } from "../types";

export function Nav({ children, className }: SidebarNavProps) {
  return (
    <nav
      aria-label="Sidebar navigation"
      className={clsx(styles.nav, className)}
    >
      <Stack gap={1}>{children}</Stack>
    </nav>
  );
}
