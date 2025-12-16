// Shared type definitions for edge functions

export interface Issue {
  type: string;
  severity?: string;
  message: string;
}

export interface Warning {
  type: string;
  message: string;
  severity?: string;
}

export interface Violation {
  resource_type: string;
  current_size: number;
  budget: number;
  overage: number;
}

export interface SecurityAnalysis {
  has_https: boolean;
  has_hsts: boolean;
  has_csp: boolean;
  has_x_frame_options: boolean;
  has_x_content_type_options: boolean;
  has_referrer_policy: boolean;
  security_score: number;
  security_headers: {
    "strict-transport-security": string | null;
    "content-security-policy": string | null;
    "x-frame-options": string | null;
    "x-content-type-options": string | null;
    "referrer-policy": string | null;
    "permissions-policy": string | null;
    "x-xss-protection": string | null;
  };
}

export interface ImageAnalysis {
  page_url: string;
  image_url: string;
  alt_text: string | null;
  title_text: string | null;
  file_name: string;
  file_extension: string;
  width: number | null;
  height: number | null;
  has_alt_text: boolean;
  is_lazy_loaded: boolean;
  uses_modern_format: boolean;
  issues: Issue[];
}

export interface MobileAnalysis {
  page_url: string;
  is_mobile_friendly: boolean;
  viewport_configured: boolean;
  text_readable: boolean;
  tap_targets_sized: boolean;
  no_horizontal_scrolling: boolean;
  mobile_issues: Issue[];
  mobile_warnings: Warning[];
}

// Helper to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}
