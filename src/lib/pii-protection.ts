/**
 * PII Protection Utilities
 * Encryption, masking, and anonymization for personal data
 */

// ============================================
// Types
// ============================================

export type PIICategory =
  | 'identifier'
  | 'financial'
  | 'health'
  | 'biometric'
  | 'genetic'
  | 'location'
  | 'behavioral';

export type SensitivityLevel = 'standard' | 'sensitive' | 'highly_sensitive';

export type MaskingRule =
  | 'full'
  | 'partial'
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'address'
  | 'name'
  | 'ip';

export interface PIIField {
  tableName: string;
  columnName: string;
  category: PIICategory;
  sensitivityLevel: SensitivityLevel;
  maskingRule?: MaskingRule;
  retentionDays?: number;
}

export interface MaskingOptions {
  showFirst?: number;
  showLast?: number;
  maskChar?: string;
  preserveFormat?: boolean;
}

// ============================================
// Masking Functions
// ============================================

/**
 * Mask a string completely
 */
export function maskFull(value: string, options: MaskingOptions = {}): string {
  const { maskChar = '*' } = options;
  return maskChar.repeat(value.length);
}

/**
 * Partially mask a string, showing first and last characters
 */
export function maskPartial(value: string, options: MaskingOptions = {}): string {
  const { showFirst = 2, showLast = 2, maskChar = '*' } = options;

  if (value.length <= showFirst + showLast) {
    return maskChar.repeat(value.length);
  }

  const first = value.slice(0, showFirst);
  const last = value.slice(-showLast);
  const middle = maskChar.repeat(value.length - showFirst - showLast);

  return `${first}${middle}${last}`;
}

/**
 * Mask an email address, showing first char of local part and domain
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return maskFull(email);

  const [local, domain] = parts;
  const maskedLocal = local.length > 1
    ? local[0] + '*'.repeat(local.length - 1)
    : '*';

  const domainParts = domain.split('.');
  const maskedDomain = domainParts.length >= 2
    ? '*'.repeat(domainParts[0].length) + '.' + domainParts.slice(1).join('.')
    : '*'.repeat(domain.length);

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Mask a phone number, showing last 4 digits
 */
export function maskPhone(phone: string, options: MaskingOptions = {}): string {
  const { preserveFormat = true } = options;

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return '*'.repeat(phone.length);
  }

  const last4 = digits.slice(-4);

  if (preserveFormat) {
    // Preserve original formatting
    let masked = '';
    let digitIndex = 0;

    for (const char of phone) {
      if (/\d/.test(char)) {
        const originalDigit = digits[digitIndex];
        const isLast4 = digitIndex >= digits.length - 4;
        masked += isLast4 ? originalDigit : '*';
        digitIndex++;
      } else {
        masked += char;
      }
    }

    return masked;
  }

  return '*'.repeat(digits.length - 4) + last4;
}

/**
 * Mask a Social Security Number
 */
export function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');

  if (digits.length !== 9) {
    return '*'.repeat(ssn.length);
  }

  // Show only last 4 digits: XXX-XX-1234
  return `***-**-${digits.slice(-4)}`;
}

/**
 * Mask a credit card number, showing last 4 digits
 */
export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 4) {
    return '*'.repeat(cardNumber.length);
  }

  const last4 = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);

  // Format as XXXX-XXXX-XXXX-1234
  if (digits.length === 16) {
    return `****-****-****-${last4}`;
  }

  return masked + last4;
}

/**
 * Mask an address, showing only city and state
 */
export function maskAddress(address: string): string {
  // Try to extract city/state from common US address formats
  const stateMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}/i);
  const cityStateMatch = address.match(/([^,]+),\s*([A-Z]{2})/i);

  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2].toUpperCase();
    return `***, ${city}, ${state}`;
  }

  // Generic masking
  return '*'.repeat(Math.min(address.length, 20)) + '...';
}

/**
 * Mask a name, showing first initial and masked last name
 */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0][0] + '*'.repeat(parts[0].length - 1);
  }

  const firstName = parts[0][0] + '.';
  const lastName = parts[parts.length - 1];
  const maskedLast = lastName[0] + '*'.repeat(lastName.length - 1);

  return `${firstName} ${maskedLast}`;
}

/**
 * Mask an IP address
 */
export function maskIP(ip: string): string {
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:****:****:****:****:****:****`;
    }
  }

  return '*'.repeat(ip.length);
}

/**
 * Apply masking based on rule type
 */
export function maskPII(value: string, rule: MaskingRule, options: MaskingOptions = {}): string {
  if (!value) return '';

  switch (rule) {
    case 'full':
      return maskFull(value, options);
    case 'partial':
      return maskPartial(value, options);
    case 'email':
      return maskEmail(value);
    case 'phone':
      return maskPhone(value, options);
    case 'ssn':
      return maskSSN(value);
    case 'credit_card':
      return maskCreditCard(value);
    case 'address':
      return maskAddress(value);
    case 'name':
      return maskName(value);
    case 'ip':
      return maskIP(value);
    default:
      return maskPartial(value, options);
  }
}

// ============================================
// Anonymization Functions
// ============================================

/**
 * Generate a deterministic anonymous ID for a user
 */
export async function generateAnonymousId(userId: string, salt: string = ''): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `ANON_${hashHex.slice(0, 12)}`;
}

/**
 * Anonymize an object by replacing specified fields
 */
export function anonymizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToAnonymize: Array<keyof T>,
  replacements?: Partial<Record<keyof T, unknown>>
): T {
  const anonymized = { ...obj };

  for (const field of fieldsToAnonymize) {
    if (field in anonymized) {
      anonymized[field] = (replacements?.[field] ?? '[REDACTED]') as T[keyof T];
    }
  }

  return anonymized;
}

/**
 * Generate random data for anonymization
 */
export function generateRandomData(type: 'email' | 'phone' | 'name' | 'address'): string {
  const randomId = Math.random().toString(36).substring(2, 10);

  switch (type) {
    case 'email':
      return `anonymous_${randomId}@example.com`;
    case 'phone':
      return '555-000-' + Math.floor(1000 + Math.random() * 9000);
    case 'name':
      return `Anonymous User ${randomId}`;
    case 'address':
      return '123 Anonymous St, City, ST 00000';
    default:
      return '[REDACTED]';
  }
}

// ============================================
// Encryption Utilities
// ============================================

/**
 * Derive an encryption key from a password
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive data using AES-GCM
 */
export async function encryptPII(data: string, encryptionKey: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(encryptionKey, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptPII(encryptedData: string, encryptionKey: string): Promise<string> {
  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(encryptionKey, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// ============================================
// Hash Functions
// ============================================

/**
 * Hash data using SHA-256 (for comparison/lookup, not encryption)
 */
export async function hashPII(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash with salt (more secure for passwords)
 */
export async function hashWithSalt(data: string, salt: string): Promise<string> {
  return hashPII(data + salt);
}

// ============================================
// Tokenization
// ============================================

// In-memory token store (in production, this would be a secure database)
const tokenStore = new Map<string, string>();

/**
 * Tokenize sensitive data (replace with a random token)
 */
export function tokenize(value: string): string {
  // Check if already tokenized
  for (const [token, original] of tokenStore.entries()) {
    if (original === value) return token;
  }

  // Generate new token
  const token = 'TOK_' + crypto.getRandomValues(new Uint8Array(16))
    .reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');

  tokenStore.set(token, value);
  return token;
}

/**
 * Detokenize (retrieve original value)
 */
export function detokenize(token: string): string | null {
  return tokenStore.get(token) || null;
}

// ============================================
// PII Detection
// ============================================

/**
 * Detect potential PII in text
 */
export function detectPII(text: string): Array<{ type: string; match: string; index: number }> {
  const findings: Array<{ type: string; match: string; index: number }> = [];

  // Email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    findings.push({ type: 'email', match: match[0], index: match.index });
  }

  // Phone pattern (US)
  const phoneRegex = /(\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    findings.push({ type: 'phone', match: match[0], index: match.index });
  }

  // SSN pattern
  const ssnRegex = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    findings.push({ type: 'ssn', match: match[0], index: match.index });
  }

  // Credit card pattern
  const ccRegex = /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g;
  while ((match = ccRegex.exec(text)) !== null) {
    findings.push({ type: 'credit_card', match: match[0], index: match.index });
  }

  // IP address pattern
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  while ((match = ipRegex.exec(text)) !== null) {
    findings.push({ type: 'ip', match: match[0], index: match.index });
  }

  return findings;
}

/**
 * Redact PII from text
 */
export function redactPII(text: string): string {
  let redacted = text;

  const findings = detectPII(text);

  // Sort by index descending to replace from end (preserve indices)
  findings.sort((a, b) => b.index - a.index);

  for (const finding of findings) {
    const replacement = `[REDACTED_${finding.type.toUpperCase()}]`;
    redacted = redacted.slice(0, finding.index) +
               replacement +
               redacted.slice(finding.index + finding.match.length);
  }

  return redacted;
}

// ============================================
// Data Export Helpers
// ============================================

/**
 * Prepare user data for GDPR export with appropriate masking
 */
export function prepareDataForExport<T extends Record<string, unknown>>(
  data: T,
  piiFields: PIIField[]
): T {
  const exported = { ...data };

  for (const field of piiFields) {
    const key = field.columnName as keyof T;
    if (key in exported && exported[key]) {
      const value = String(exported[key]);

      // For export, we show the data but may still mask highly sensitive fields
      if (field.sensitivityLevel === 'highly_sensitive' && field.maskingRule) {
        exported[key] = maskPII(value, field.maskingRule) as T[keyof T];
      }
    }
  }

  return exported;
}

/**
 * Prepare user data for deletion (anonymization)
 */
export async function prepareDataForDeletion<T extends Record<string, unknown>>(
  data: T,
  userId: string,
  piiFields: PIIField[]
): Promise<T> {
  const anonymized = { ...data };
  const anonymousId = await generateAnonymousId(userId);

  for (const field of piiFields) {
    const key = field.columnName as keyof T;
    if (key in anonymized) {
      switch (field.category) {
        case 'identifier':
          anonymized[key] = `[DELETED_${anonymousId}]` as T[keyof T];
          break;
        case 'financial':
        case 'health':
        case 'biometric':
        case 'genetic':
          anonymized[key] = '[DELETED]' as T[keyof T];
          break;
        case 'location':
          anonymized[key] = '[LOCATION_DELETED]' as T[keyof T];
          break;
        case 'behavioral':
          anonymized[key] = null as T[keyof T];
          break;
        default:
          anonymized[key] = '[DELETED]' as T[keyof T];
      }
    }
  }

  return anonymized;
}
