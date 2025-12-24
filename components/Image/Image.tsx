"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import styles from "./Image.module.scss";

import { Skeleton } from "../Skeleton/Skeleton";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  fallbackSrc?: string;
  aspectRatio?: string | number;
  rounded?: boolean;
}

export function Image({
  src,
  alt,
  className,
  fit,
  style,
  onLoad,
  onError,
  fallbackSrc,
  aspectRatio,
  rounded = true,
  ...props
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setShowSkeleton(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowSkeleton(true);
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && !hasError) {
      setHasError(true);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoaded(true);
    onError?.(e);
  };

  return (
    <div
      className={clsx(styles.wrapper, rounded && styles.rounded, className)}
      style={{ aspectRatio, ...style }}
    >
      {!isLoaded && showSkeleton && (
        <Skeleton
          className={styles.skeleton}
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
          }}
        />
      )}
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        className={clsx(
          styles.image,
          fit && styles[`fit-${fit}`],
          showSkeleton && styles["with-transition"]
        )}
        onLoad={handleLoad}
        onError={handleError}
        data-loaded={isLoaded ? "true" : "false"}
        style={{ width: "100%", height: "100%" }}
        {...props}
      />
    </div>
  );
}
