import clsx from "clsx";
import React from "react";

import styles from "../Sidebar.module.scss";
import { SidebarHeaderProps } from "../types";

export function Header({ children, className }: SidebarHeaderProps) {
  return <div className={clsx(styles.header, className)}>{children}</div>;
}
