import { v4 as uuidv4 } from "uuid";

export const MAX_IMAGE_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export type AllowedImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";

type DetectedImage = {
  mime: AllowedImageMime;
  extension: "jpg" | "png" | "gif" | "webp";
};

const MIME_BY_EXTENSION: Record<DetectedImage["extension"], AllowedImageMime> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

function detectImage(buffer: Buffer): DetectedImage | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { mime: "image/png", extension: "png" };
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return { mime: "image/gif", extension: "gif" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
}

function containsPhpPayload(buffer: Buffer) {
  return buffer.toString("utf8").toLowerCase().includes("<?php");
}

export async function validateUploadedImage(
  file: File | Blob,
  options?: {
    allowedTypes?: Iterable<string>;
    maxSize?: number;
  }
) {
  const maxSize = options?.maxSize ?? MAX_IMAGE_UPLOAD_SIZE;
  const allowedTypes = new Set(options?.allowedTypes ?? Object.values(MIME_BY_EXTENSION));

  if (file.size <= 0) {
    throw new UploadValidationError("Uploaded file is empty");
  }

  if (file.size > maxSize) {
    throw new UploadValidationError("File size exceeds 10MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(buffer);

  if (!detected || !allowedTypes.has(detected.mime)) {
    throw new UploadValidationError("Unsupported image type");
  }

  if (containsPhpPayload(buffer)) {
    throw new UploadValidationError("Invalid image content");
  }

  return {
    buffer,
    mime: detected.mime,
    extension: detected.extension,
    filename: `${uuidv4()}.${detected.extension}`,
  };
}
