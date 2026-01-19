import clsx from "clsx";
import React from "react";

import { Stack } from "../../../Layout/Layout";
import { SidebarNavProps } from "../../types";
import styles from "./Nav.module.scss";

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

Nav.displayName = "Nav";
