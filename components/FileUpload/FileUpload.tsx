"use client";

import clsx from "clsx";
import {
  Asterisk,
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Upload,
  X,
} from "lucide-react";
import React, {
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type ThemeClassNames,
  ThemePartsBoundary,
  useOwnedThemeParts,
  useThemeParts,
} from "../../styles/theming/parts";
import { ThemedIcon } from "../../styles/theming/ThemedIcon";
import { ThemeSurface } from "../../styles/theming/ThemeSurface";
import { Badge } from "../Badge/Badge";
import { Button } from "../Button/Button";
import { Image } from "../Image/Image";
import { Flex, Stack, Switcher } from "../Layout/Layout";
import { Slat } from "../Slat/Slat";
import { Text } from "../Text/Text";
import styles from "./FileUpload.module.scss";

const enum Status {
  Disabled = "disabled",
  Error = "error",
  Void = "void",
  HasFiles = "hasFiles",
  Idle = "idle",
}

export interface FileUploadProps {
  classNames?: ThemeClassNames<"FileUpload">;
  /** Label for the file upload */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Initial files to show */
  defaultFiles?: File[];
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Required field */
  required?: boolean;
  /** Show image previews for supported file types */
  showPreview?: boolean;
  /** Callback when files are selected */
  onChange?: (files: File[]) => void;
  /** Custom class name */
  className?: string;
  /** Force active/void state for debugging */
  forceActive?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  classNames,
  label,
  helperText,
  accept,
  maxSize,
  multiple = false,
  defaultFiles = [],
  disabled = false,
  error = false,
  errorMessage,
  required = false,
  showPreview = false,
  onChange,
  className = "",
  forceActive = false,
}) => {
  const doomPart = useOwnedThemeParts("FileUpload", classNames, {
    disabled: disabled,
  });

  const [files, setFiles] = useState<File[]>(defaultFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const previewsRef = useRef<Record<string, string>>({});

  // Keep ref in sync for unmount cleanup
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) =>
        URL.revokeObjectURL(url),
      );
    };
  }, []);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const size = 20;

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
      return <ThemedIcon icon={FileImage} iconName="fileImage" size={size} />;
    }
    if (["mp4", "mov", "avi", "mkv", "webm", "flv"].includes(ext || "")) {
      return <ThemedIcon icon={FileVideo} iconName="fileVideo" size={size} />;
    }
    if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext || "")) {
      return <ThemedIcon icon={FileAudio} iconName="fileAudio" size={size} />;
    }
    if (
      [
        "js",
        "ts",
        "jsx",
        "tsx",
        "html",
        "css",
        "json",
        "py",
        "java",
        "cpp",
        "c",
        "go",
      ].includes(ext || "")
    ) {
      return <ThemedIcon icon={FileCode} iconName="fileCode" size={size} />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return (
        <ThemedIcon icon={FileArchive} iconName="fileArchive" size={size} />
      );
    }
    if (["pdf"].includes(ext || "")) {
      return <ThemedIcon icon={FileText} iconName="fileText" size={size} />;
    }
    if (["xls", "xlsx", "csv", "ods"].includes(ext || "")) {
      return (
        <ThemedIcon
          icon={FileSpreadsheet}
          iconName="fileSpreadsheet"
          size={size}
        />
      );
    }

    return <ThemedIcon icon={FileIcon} iconName="file" size={size} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const generatePreview = useCallback(
    (file: File) => {
      if (showPreview && file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviews((prev) => ({
          ...prev,
          [file.name]: url,
        }));
      }
    },
    [showPreview],
  );

  const isFileAccepted = (file: File): boolean => {
    if (!accept) {
      return true;
    }
    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    return acceptedTypes.some((type) => {
      // Extension match: ".pdf", ".doc"
      if (type.startsWith(".")) {
        return fileName.endsWith(type);
      }
      // Wildcard MIME: "image/*", "video/*"
      if (type.endsWith("/*")) {
        const category = type.slice(0, -2);
        return mimeType.startsWith(category + "/");
      }
      // Exact MIME: "application/pdf"
      return mimeType === type;
    });
  };

  const validateFiles = (fileList: FileList | null): File[] => {
    if (!fileList) {
      return [];
    }
    const validFiles: File[] = [];
    setUploadError("");

    Array.from(fileList).forEach((file) => {
      if (!isFileAccepted(file)) {
        setUploadError(`File "${file.name}" is not an accepted file type`);
        return;
      }
      if (maxSize && file.size > maxSize) {
        setUploadError(
          `File "${file.name}" exceeds maximum size of ${formatFileSize(
            maxSize,
          )}`,
        );
        return;
      }
      validFiles.push(file);
      generatePreview(file);
    });

    return validFiles;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const validFiles = validateFiles(event.target.files);
    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onChange?.(newFiles);
    }
  };

  const handleDragHandlers = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    onDragLeave: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      // Check if we're moving to a child element
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }
      setIsDragging(false);
    },
    onDragOver: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) {
        return;
      }
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        const newFiles = multiple ? [...files, ...validFiles] : validFiles;
        setFiles(newFiles);
        onChange?.(newFiles);
      }
    },
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      const key = fileToRemove.name;
      if (previews[key]) {
        URL.revokeObjectURL(previews[key]);
        const newPreviews = { ...previews };
        delete newPreviews[key];
        setPreviews(newPreviews);
      }
    }
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsActive(true);
      inputRef.current?.click();
      const handleFocus = () => {
        setIsActive(false);
        window.removeEventListener("focus", handleFocus);
      };
      window.addEventListener("focus", handleFocus);
    }
  };

  const displayError = error && errorMessage ? errorMessage : uploadError;
  const hasFiles = files.length > 0;
  const isVoid = (isDragging || isActive || forceActive) && !hasFiles;

  const status = useMemo(() => {
    if (disabled) {
      return Status.Disabled;
    }
    if (displayError) {
      return Status.Error;
    }
    if (isVoid) {
      return Status.Void;
    }
    if (hasFiles) {
      return Status.HasFiles;
    }
    return Status.Idle;
  }, [disabled, displayError, isVoid, hasFiles]);

  return (
    <ThemePartsBoundary
      classNames={classNames}
      component="FileUpload"
      visual={{ disabled }}
    >
      <div
        {...doomPart("root", {
          "data-invalid": !!displayError || undefined,
          "data-dragging": isDragging || forceActive || undefined,
          className: clsx(styles.window, className, {
            [styles.void]: isVoid,
            [styles.disabled]: disabled,
          }),
        })}
        {...handleDragHandlers}
      >
        <ThemeSurface surface="inverted">
          <Switcher
            align="center"
            {...doomPart("header", {
              className: clsx(styles.header, {
                [styles.errorHeader]: status === Status.Error,
                [styles.disabledHeader]: disabled,
              }),
            })}
            gap={2}
            justify="space-between"
            threshold="xxs"
          >
            <div
              {...doomPart("headerContent", {
                className: styles.headerContent,
              })}
            >
              <Text
                {...doomPart("headerTitle", { className: styles.headerTitle })}
                id="upload-title"
              >
                {label || "Upload Files"}
                {required && (
                  <span
                    {...doomPart("requiredMark", {
                      className: styles.requiredMark,
                    })}
                  >
                    <ThemedIcon
                      aria-label="required"
                      icon={Asterisk}
                      iconName="asterisk"
                      size={14}
                    />
                  </span>
                )}
              </Text>
            </div>
            <Badge
              aria-live="polite"
              role="status"
              variant={
                status === Status.Error
                  ? "error"
                  : status === Status.HasFiles
                    ? "success"
                    : isVoid
                      ? "primary"
                      : "secondary"
              }
            >
              {status === Status.Error
                ? "Error"
                : status === Status.HasFiles
                  ? `${files.length} selected`
                  : isVoid
                    ? "Waiting..."
                    : disabled
                      ? "Disabled"
                      : "Ready"}
            </Badge>
          </Switcher>
        </ThemeSurface>

        <div
          {...doomPart("body", {
            "data-invalid": !!displayError || undefined,
            "data-dragging": isDragging || forceActive || undefined,
            className: clsx(styles.body, {
              [styles.hasFiles]: hasFiles,
              [styles.dragging]: isDragging || forceActive,
              [styles.disabled]: disabled,
              [styles.error]: !!displayError,
            }),
          })}
        >
          <div
            aria-hidden="true"
            {...doomPart("starField", { className: styles.starField })}
          />
          <input
            ref={inputRef}
            accept={accept}
            aria-describedby={clsx({
              "upload-helper": !!helperText,
              "upload-error": !!displayError,
            })}
            aria-invalid={!!displayError}
            aria-label="File upload input"
            aria-required={required}
            {...doomPart("hiddenInput", { className: styles.hiddenInput })}
            disabled={disabled}
            multiple={multiple}
            type="file"
            onChange={handleFileChange}
          />

          {!hasFiles ? (
            <div
              {...doomPart("emptyState", { className: styles.emptyState })}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={handleClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick();
                }
              }}
            >
              <Stack align="center" gap={4}>
                <div
                  aria-hidden="true"
                  {...doomPart("voidIconWrapper", {
                    className: styles.voidIconWrapper,
                  })}
                >
                  <ThemedIcon
                    icon={Upload}
                    iconName="upload"
                    {...doomPart("icon", { className: styles.icon })}
                    size={48}
                    strokeWidth={2}
                  />
                </div>
                <Stack align="center" gap={1}>
                  <Text
                    {...doomPart("voidText", { className: styles.voidText })}
                    weight="bold"
                  >
                    {isDragging || isActive || forceActive
                      ? "Drop files now"
                      : "Drag and drop files"}
                  </Text>
                  <Text
                    {...doomPart("secondary", { className: styles.secondary })}
                    variant="small"
                  >
                    or click to browse
                  </Text>
                </Stack>
                {helperText && (
                  <Text
                    {...doomPart("helperText", {
                      className: styles.helperText,
                    })}
                    id="upload-helper"
                    variant="small"
                  >
                    {helperText}
                  </Text>
                )}
                {displayError && (
                  <Text
                    {...doomPart("errorText", {
                      "data-invalid": true,
                      className: styles.errorText,
                    })}
                    id="upload-error"
                    variant="small"
                  >
                    {displayError}
                  </Text>
                )}
              </Stack>
            </div>
          ) : (
            <Flex
              {...doomPart("fileList", { className: styles.fileList })}
              direction="column"
              gap={4}
              justify="space-between"
            >
              <Stack gap={2}>
                {files.map((file, index) => {
                  const previewUrl = previews[file.name];
                  return (
                    <Slat
                      key={`${file.name}-${index}`}
                      appendContent={
                        <Button
                          aria-label={`Remove ${file.name}`}
                          {...doomPart("removeButton", {
                            className: styles.removeButton,
                          })}
                          size="sm"
                          type="button"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                        >
                          <ThemedIcon
                            aria-hidden="true"
                            icon={X}
                            iconName="close"
                            size={16}
                          />
                        </Button>
                      }
                      label={file.name}
                      prependContent={
                        previewUrl ? (
                          <PreviewImage alt={file.name} src={previewUrl} />
                        ) : (
                          getFileIcon(file.name)
                        )
                      }
                      secondaryLabel={formatFileSize(file.size)}
                    />
                  );
                })}
              </Stack>

              {multiple && (
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  UPLOAD MORE FILES
                </Button>
              )}
            </Flex>
          )}
        </div>
      </div>
    </ThemePartsBoundary>
  );
};

const PreviewImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const doomPart = useThemeParts("FileUpload", undefined, {});

  const { className: previewClass, ...imagePart } = doomPart("previewImg");
  return (
    <div {...doomPart("previewWrapper", { className: styles.previewWrapper })}>
      <Image
        alt={
          alt
            .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "")
            .replace(/[-_]/g, " ") || "File preview"
        }
        {...imagePart}
        className={styles.previewImg}
        classNames={{ image: previewClass }}
        fit="cover"
        rounded={false}
        src={src}
      />
    </div>
  );
};
