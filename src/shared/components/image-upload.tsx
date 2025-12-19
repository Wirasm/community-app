"use client";

import Image from "next/image";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
  error?: string | null;
  maxSizeMB?: number;
  aspectRatio?: "square" | "banner";
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  currentUrl,
  onUpload,
  isUploading = false,
  progress = 0,
  error,
  maxSizeMB = 2,
  aspectRatio = "square",
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const aspectClasses = aspectRatio === "square" ? "aspect-square w-24" : "aspect-[3/1] w-full";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={cn("relative overflow-hidden rounded-md border bg-muted", aspectClasses)}>
          {currentUrl ? (
            <Image src={currentUrl} alt="Current image" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Upload overlay when uploading */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-sm font-medium">{progress}%</div>
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isUploading}
          >
            {isUploading ? "Uploading..." : currentUrl ? "Change" : "Upload"}
          </Button>
          <p className="text-xs text-muted-foreground">Max {maxSizeMB}MB, JPG/PNG/WebP</p>
        </div>
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
