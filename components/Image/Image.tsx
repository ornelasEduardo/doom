"use client";

import clsx from "clsx";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Skeleton } from "../Skeleton/Skeleton";
import styles from "./Image.module.scss";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  fallbackSrc?: string;
  aspectRatio?: string | number;
  rounded?: boolean;
}

const toCssValue = (val: string | number | undefined) => {
  if (val === undefined || val === null) {
    return undefined;
  }
  if (typeof val === "number") {
    return `${val}px`;
  }
  return val;
};

const getIntrinsicSize = (
  val: string | number | undefined,
): number | undefined => {
  if (typeof val === "number") {
    return val;
  }
  if (typeof val === "string" && !val.endsWith("%")) {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

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
  width,
  height,
  ...props
}: ImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [showSkeleton, setShowSkeleton] = useState(true);

  const computedAspectRatio = useMemo(() => {
    if (aspectRatio) {
      return aspectRatio;
    }
    const w = getIntrinsicSize(width);
    const h = getIntrinsicSize(height);
    return w && h ? `${w} / ${h}` : undefined;
  }, [aspectRatio, width, height]);

  const prevSrcRef = useRef(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setStatus("loaded");
    }
  }, []);

  // Reset state when source changes
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      setStatus("loading");
      setShowSkeleton(true);
      prevSrcRef.current = src;
    }
  }, [src]);

  // When loaded, keep skeleton for a moment to allow cross-fade
  useEffect(() => {
    if (status === "loaded") {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 500); // 500ms delay to allow image to fade in completely
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleLoad = useCallback(
    async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      onLoad?.(e);
      const img = e.currentTarget;
      try {
        if (img.decode) {
          await img.decode();
        }
      } catch (error) {
        // ignore decode errors (e.g. invalid image data)
      } finally {
        setStatus("loaded");
      }
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (fallbackSrc && status !== "error") {
        // Prevents infinite loop if fallback also fails
        if (e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
          return;
        }
      }
      setStatus("error");
      setShowSkeleton(false); // Remove skeleton immediately on error to show broken image icon or alt
      onError?.(e);
    },
    [fallbackSrc, status, onError],
  );

  return (
    <div
      className={clsx(styles.wrapper, rounded && styles.rounded, className)}
      style={{
        aspectRatio: computedAspectRatio,
        width: toCssValue(width),
        height: toCssValue(height),
        ...style,
      }}
    >
      {/* Skeleton Layer */}
      <div
        aria-hidden="true"
        className={clsx(
          styles.skeletonLayer,
          status === "loaded" && styles.fadeOut,
        )}
      >
        {showSkeleton && (
          <Skeleton
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </div>

      {/* Image Layer */}
      <img
        ref={imgRef}
        alt={alt}
        className={clsx(
          styles.image,
          fit && styles[`fit-${fit}`],
          status === "loaded" ? styles.visible : styles.hidden,
        )}
        height={height}
        src={src}
        width={width}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
}
