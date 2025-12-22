import React, { useRef, useState, DragEvent } from "react";
import styles from "./FileUpload.module.scss";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Stack, Flex } from "../Layout/Layout";
import { Badge } from "../Badge/Badge";
import { Upload, File, X, Asterisk } from "lucide-react";
import clsx from "clsx";

const enum Status {
  Disabled = "disabled",
  Error = "error",
  Void = "void",
  HasFiles = "hasFiles",
  Idle = "idle",
}

export interface FileUploadProps {
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
  /** Callback when files are selected */
  onChange?: (files: File[]) => void;
  /** Custom class name */
  className?: string;
  /** Force active/void state for debugging */
  forceActive?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
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
  onChange,
  className = "",
  forceActive = false,
}) => {
  const [files, setFiles] = useState<File[]>(defaultFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileTypeColor = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    // Images - Purple
    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || "")) {
      return "var(--purple, #8b5cf6)";
    }
    // Videos - Red
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext || "")) {
      return "var(--red, #ef4444)";
    }
    // Documents - Blue
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext || "")) {
      return "var(--blue, #3b82f6)";
    }
    // Code - Green
    if (
      ["js", "ts", "jsx", "tsx", "html", "css", "json", "py", "java"].includes(
        ext || ""
      )
    ) {
      return "var(--green, #10b981)";
    }
    // Archives - Orange
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return "var(--orange, #f97316)";
    }
    // Default - Primary
    return "var(--primary)";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFiles = (fileList: FileList | null): File[] => {
    if (!fileList) return [];

    const validFiles: File[] = [];
    setUploadError("");

    Array.from(fileList).forEach((file) => {
      // Check file size
      if (maxSize && file.size > maxSize) {
        setUploadError(
          `File "${file.name}" exceeds maximum size of ${formatFileSize(
            maxSize
          )}`
        );
        return;
      }

      validFiles.push(file);
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

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const validFiles = validateFiles(e.dataTransfer.files);

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFiles);
      onChange?.(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);

    // Reset input value to allow re-uploading the same file
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsActive(true);
      inputRef.current?.click();

      // Reset void state when user returns focus (dialog closes)
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

  // Derive component status
  const getComponentStatus = () => {
    if (disabled) return Status.Disabled;
    if (displayError) return Status.Error;
    if (isVoid) return Status.Void;
    if (hasFiles) return Status.HasFiles;
    return Status.Idle;
  };

  const status = getComponentStatus();

  const getBadgeVariant = () => {
    switch (status) {
      case Status.HasFiles:
        return "success";
      case Status.Void:
        return "primary";
      case Status.Disabled:
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case Status.HasFiles:
        return `${files.length} selected`;
      case Status.Void:
        return "Awaiting upload...";
      case Status.Disabled:
        return "Disabled";
      default:
        return "Ready";
    }
  };

  return (
    <div
      className={`${styles.window} ${className} ${isVoid ? styles.void : ""} ${
        status === Status.Disabled ? styles.disabled : ""
      }`}
    >
      {/* Window Header */}
      <div
        className={clsx(styles.header, {
          [styles.errorHeader]: status === Status.Error,
          [styles.disabledHeader]: status === Status.Disabled,
        })}
      >
        <Text className={styles.headerTitle}>
          <Flex align="flex-start">
            {status === Status.Error ? displayError : "Upload Files"}
            {required && !displayError && <Asterisk size={16} />}
          </Flex>
        </Text>
        {status === Status.Error ? (
          <Badge variant="error" className={styles.errorBadge}>
            Error
          </Badge>
        ) : (
          <Badge variant={getBadgeVariant()}>{getStatusLabel()}</Badge>
        )}
      </div>

      {/* Window Body */}
      <div
        className={clsx(styles.body, {
          [styles.hasFiles]: status === Status.HasFiles,
          [styles.dragging]: isDragging || forceActive, // Keep visual drag feedback
          [styles.disabled]: status === Status.Disabled,
          [styles.error]: status === Status.Error,
        })}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className={styles.hiddenInput}
          aria-label="File upload input"
        />

        {!hasFiles ? (
          <Stack
            gap="var(--spacing-md)"
            align="center"
            className={styles.emptyState}
          >
            <div className={styles.voidIconWrapper}>
              <Upload className={styles.icon} size={48} strokeWidth={2} />
            </div>
            <Stack gap="var(--spacing-xs)" align="center">
              <Text weight="bold" className={styles.voidText}>
                {isDragging || isActive || forceActive
                  ? "Drop files now"
                  : "Drag and drop files"}
              </Text>
              <Text variant="small" className={styles.secondary}>
                or click to browse
              </Text>
            </Stack>
            {helperText && (
              <Text variant="small" className={styles.helperText}>
                {helperText}
              </Text>
            )}
          </Stack>
        ) : (
          <Stack gap="var(--spacing-sm)" className={styles.fileList}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className={styles.fileItem}>
                <Flex
                  justify="space-between"
                  align="center"
                  gap="var(--spacing-sm)"
                >
                  <Flex
                    gap="var(--spacing-sm)"
                    align="center"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <File
                      className={styles.fileIcon}
                      size={20}
                      style={{ color: getFileTypeColor(file.name) }}
                    />
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text className={styles.fileName}>{file.name}</Text>
                      <Text variant="small" className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </Text>
                    </Stack>
                  </Flex>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className={styles.removeButton}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={16} />
                  </button>
                </Flex>
              </div>
            ))}
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
          </Stack>
        )}
      </div>
    </div>
  );
};
