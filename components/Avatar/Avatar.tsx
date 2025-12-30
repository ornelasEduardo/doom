"use client";

import clsx from "clsx";
import React, { useState } from "react";

import { Image } from "../Image/Image";
import styles from "./Avatar.module.scss";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: React.ReactNode;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

export function Avatar({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  shape = "square",
  className,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={clsx(styles.avatar, styles[size], styles[shape], className)}
    >
      {src && !hasError ? (
        <Image
          alt={alt}
          className={styles.image}
          fit="cover"
          rounded={false}
          src={src}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={clsx(styles.fallback, styles[size])}>
          {typeof fallback === "string" ? fallback.slice(0, 2) : fallback}
        </span>
      )}
    </div>
  );
}
