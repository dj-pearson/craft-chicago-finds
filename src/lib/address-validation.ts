// Address validation utilities
// Using simple validation for now - can be upgraded to Google Places API later

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: Address;
}

// US States for validation
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
]);

// ZIP code validation
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

// Street address validation (must contain number and street name)
const STREET_REGEX = /^\d+\s+.+/;

/**
 * Validates a US address
 * @param address Address to validate
 * @returns Validation result with errors and warnings
 */
export function validateAddress(address: Partial<Address>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!address.street?.trim()) {
    errors.push('Street address is required');
  } else if (!STREET_REGEX.test(address.street.trim())) {
    warnings.push('Street address should include a street number');
  }

  if (!address.city?.trim()) {
    errors.push('City is required');
  } else if (address.city.length < 2) {
    errors.push('City name must be at least 2 characters');
  }

  if (!address.state?.trim()) {
    errors.push('State is required');
  } else {
    const stateUpper = address.state.trim().toUpperCase();
    if (!US_STATES.has(stateUpper)) {
      errors.push('Invalid US state code (use 2-letter abbreviation like "IL")');
    }
  }

  if (!address.zip?.trim()) {
    errors.push('ZIP code is required');
  } else if (!ZIP_REGEX.test(address.zip.trim())) {
    errors.push('Invalid ZIP code format (use 5 digits or 5+4 format)');
  }

  // Normalize the address
  const normalized: Address = {
    street: address.street?.trim() || '',
    city: address.city?.trim().replace(/\b\w/g, l => l.toUpperCase()) || '', // Title case
    state: address.state?.trim().toUpperCase() || '',
    zip: address.zip?.trim() || '',
    country: 'US'
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalized: errors.length === 0 ? normalized : undefined
  };
}

/**
 * Formats an address for display
 */
export function formatAddress(address: Address): string {
  return `${address.street}\n${address.city}, ${address.state} ${address.zip}`;
}

/**
 * Parses a single-line address string into components
 * Best effort parsing - may not work for all formats
 */
export function parseAddressString(addressString: string): Partial<Address> {
  const parts = addressString.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    return { street: addressString };
  }

  const street = parts[0];
  const cityStateZip = parts[parts.length - 1];
  
  // Try to extract state and ZIP from last part
  const stateZipMatch = cityStateZip.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/i);
  
  if (stateZipMatch) {
    const state = stateZipMatch[1];
    const zip = stateZipMatch[2];
    const city = cityStateZip.replace(stateZipMatch[0], '').trim();
    
    return { street, city, state, zip };
  }
  
  return { street, city: parts.slice(1).join(', ') };
}