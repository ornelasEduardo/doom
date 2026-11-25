"use client";
import clsx from "clsx";
import React, { useState } from "react";

import {
  type ThemeClassNames,
  useThemeParts,
} from "../../styles/theming/parts";
import { Image } from "../Image/Image";
import styles from "./Avatar.module.scss";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

interface AvatarProps {
  classNames?: ThemeClassNames<"Avatar">;
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

export function Avatar({
  classNames,
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  shape = "square",
  className,
}: AvatarProps) {
  const doomPart = useThemeParts("Avatar", classNames, { size: size });

  const [hasError, setHasError] = useState(false);

  return (
    <div
      {...doomPart("root", {
        className: clsx(styles.avatar, styles[size], styles[shape], className),
      })}
    >
      {src && !hasError ? (
        <Image
          alt={alt}
          {...doomPart("image", { className: styles.image })}
          fit="cover"
          rounded={false}
          src={src}
          onError={() => setHasError(true)}
        />
      ) : (
        <span
          {...doomPart("fallback", {
            className: clsx(styles.fallback, styles[size]),
          })}
        >
          {typeof fallback === "string" ? fallback.slice(0, 2) : fallback}
        </span>
      )}
    </div>
  );
}
