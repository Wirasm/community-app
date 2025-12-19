"use client";

import { useCallback, useState } from "react";

import { ALLOWED_IMAGE_TYPES, isAllowedImageType, MAX_AVATAR_SIZE } from "../schemas";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  url: string | null;
}

interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: readonly string[];
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

const initialState: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  url: null,
};

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = MAX_AVATAR_SIZE,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UploadState>(initialState);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB`;
      }
      if (!isAllowedImageType(file.type)) {
        return `Invalid file type. Allowed: ${allowedTypes.join(", ")}`;
      }
      return null;
    },
    [maxSize, allowedTypes],
  );

  const upload = useCallback(
    async (endpoint: string, file: File): Promise<string | null> => {
      // Client-side validation
      const validationError = validateFile(file);
      if (validationError) {
        setState({ isUploading: false, progress: 0, error: validationError, url: null });
        onError?.(validationError);
        return null;
      }

      setState({ isUploading: true, progress: 10, error: null, url: null });

      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress for small files (standard upload doesn't support real progress)
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 90),
        }));
      }, 200);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `Upload failed (HTTP ${response.status})`;
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Response is not JSON - use status text
            errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
          }
          setState({ isUploading: false, progress: 0, error: errorMessage, url: null });
          onError?.(errorMessage);
          return null;
        }

        const { url } = await response.json();
        setState({ isUploading: false, progress: 100, error: null, url });
        onSuccess?.(url);
        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setState({ isUploading: false, progress: 0, error: message, url: null });
        onError?.(message);
        return null;
      } finally {
        clearInterval(progressInterval);
      }
    },
    [validateFile, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    upload,
    reset,
    validateFile,
  };
}
