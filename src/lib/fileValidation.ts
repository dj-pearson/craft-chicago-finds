/**
 * File Upload Validation
 * Client-side validation for uploaded files
 */

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedTypes: string[];
  allowedExtensions: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
  minDimensions?: {
    width: number;
    height: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// Validation presets
export const VALIDATION_PRESETS = {
  PRODUCT_IMAGE: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 400, height: 400 },
  },
  PROFILE_AVATAR: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxDimensions: { width: 2048, height: 2048 },
    minDimensions: { width: 100, height: 100 },
  },
  DOCUMENT: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
  },
} as const;

/**
 * Validate file type and extension
 */
export function validateFileType(file: File, config: FileValidationConfig): ValidationResult {
  const fileName = file.name.toLowerCase();
  const fileExt = fileName.substring(fileName.lastIndexOf('.'));
  
  // Check MIME type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`,
    };
  }
  
  // Check file extension
  if (!config.allowedExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, config: FileValidationConfig): ValidationResult {
  if (file.size > config.maxSizeBytes) {
    const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  config: FileValidationConfig
): Promise<ValidationResult> {
  if (!config.maxDimensions && !config.minDimensions) {
    return { valid: true };
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const warnings: string[] = [];
      
      // Check maximum dimensions
      if (config.maxDimensions) {
        if (img.width > config.maxDimensions.width || img.height > config.maxDimensions.height) {
          resolve({
            valid: false,
            error: `Image dimensions (${img.width}x${img.height}) exceed maximum allowed (${config.maxDimensions.width}x${config.maxDimensions.height})`,
          });
          return;
        }
      }
      
      // Check minimum dimensions
      if (config.minDimensions) {
        if (img.width < config.minDimensions.width || img.height < config.minDimensions.height) {
          resolve({
            valid: false,
            error: `Image dimensions (${img.width}x${img.height}) are below minimum required (${config.minDimensions.width}x${config.minDimensions.height})`,
          });
          return;
        }
      }
      
      // Warning for non-square avatars
      const isAvatarConfig = config.maxSizeBytes === 5 * 1024 * 1024 && 
        config.minDimensions?.width === 100 && 
        config.minDimensions?.height === 100;
      
      if (isAvatarConfig && img.width !== img.height) {
        warnings.push('Image is not square. It may be cropped.');
      }
      
      resolve({ valid: true, warnings: warnings.length > 0 ? warnings : undefined });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to load image. File may be corrupted.',
      });
    };
    
    img.src = objectUrl;
  });
}

/**
 * Check for potentially dangerous file names
 */
export function validateFileName(file: File): ValidationResult {
  const fileName = file.name;
  const warnings: string[] = [];
  
  // Check for null bytes
  if (fileName.includes('\0')) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
    };
  }
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'File name contains invalid path characters',
    };
  }
  
  // Check for very long file names
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (max 255 characters)',
    };
  }
  
  // Warning for unusual characters
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    warnings.push('File name contains special characters. It will be sanitized.');
  }
  
  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  let sanitized = fileName.replace(/^.*[\\\/]/, '');
  
  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');
  
  // Remove special characters except dots, hyphens, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Remove multiple dots (except before extension)
  const lastDot = sanitized.lastIndexOf('.');
  if (lastDot > 0) {
    const name = sanitized.substring(0, lastDot).replace(/\./g, '-');
    const ext = sanitized.substring(lastDot);
    sanitized = name + ext;
  }
  
  // Ensure it's not empty
  if (!sanitized) {
    sanitized = 'file';
  }
  
  return sanitized;
}

/**
 * Complete file validation
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig
): Promise<ValidationResult> {
  const allWarnings: string[] = [];
  
  // Validate file name
  const nameValidation = validateFileName(file);
  if (!nameValidation.valid) {
    return nameValidation;
  }
  if (nameValidation.warnings) {
    allWarnings.push(...nameValidation.warnings);
  }
  
  // Validate file type
  const typeValidation = validateFileType(file, config);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  // Validate file size
  const sizeValidation = validateFileSize(file, config);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Validate image dimensions if applicable
  if (config.maxDimensions || config.minDimensions) {
    const dimensionValidation = await validateImageDimensions(file, config);
    if (!dimensionValidation.valid) {
      return dimensionValidation;
    }
    if (dimensionValidation.warnings) {
      allWarnings.push(...dimensionValidation.warnings);
    }
  }
  
  return {
    valid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  config: FileValidationConfig,
  maxFiles: number = 10
): Promise<ValidationResult> {
  // Check file count
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed.`,
    };
  }
  
  // Validate each file
  for (const file of files) {
    const result = await validateFile(file, config);
    if (!result.valid) {
      return {
        valid: false,
        error: `${file.name}: ${result.error}`,
      };
    }
  }
  
  return { valid: true };
}
