/**
 * Server-side File Validation
 * Edge function utilities for validating uploaded files
 */

interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const FILE_VALIDATION_CONFIGS = {
  PRODUCT_IMAGE: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  PROFILE_AVATAR: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  DOCUMENT: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },
} as const;

/**
 * Validate file from FormData
 */
export async function validateUploadedFile(
  file: File,
  config: FileValidationConfig
): Promise<{ valid: boolean; error?: string }> {
  // Validate file size
  if (file.size > config.maxSizeBytes) {
    const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Validate MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
    };
  }

  // Validate file extension
  const fileName = file.name.toLowerCase();
  const fileExt = fileName.substring(fileName.lastIndexOf('.'));
  
  if (!config.allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
    };
  }

  // Validate file name for security
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid file name',
    };
  }

  return { valid: true };
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string, userId: string): string {
  // Get file extension
  const lastDot = fileName.lastIndexOf('.');
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';
  
  // Create safe base name
  let baseName = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
  
  // Add timestamp and user prefix for uniqueness
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${userId.substring(0, 8)}-${timestamp}-${randomSuffix}-${baseName}${ext}`;
}

/**
 * Validate image file signature (magic bytes)
 * Prevents file type spoofing
 */
export async function validateImageSignature(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).slice(0, 12);
  
  // JPEG signature: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }
  
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return true;
  }
  
  // WebP signature: RIFF .... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }
  
  return false;
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      message: error,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
