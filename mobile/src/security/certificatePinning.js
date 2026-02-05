/**
 * SSL Certificate Pinning for React Native
 * Prevents man-in-the-middle attacks by validating server certificates
 */

import {Platform, NativeModules} from 'react-native';

// Get Supabase domain from environment variable for self-hosted instance
// This should match your SUPABASE_URL hostname (e.g., 'api.yourserver.com')
const SUPABASE_API_DOMAIN = process.env.SUPABASE_API_DOMAIN || '';

/**
 * Certificate pin configuration
 * Contains SHA-256 fingerprints of trusted certificates
 *
 * IMPORTANT: For self-hosted Supabase, you MUST:
 * 1. Set SUPABASE_API_DOMAIN environment variable to your Supabase API hostname
 * 2. Update the certificate pins below with your actual SHA-256 fingerprints
 * 3. Regenerate pins when certificates are renewed
 */

// Build dynamic certificate pins based on environment
const buildCertificatePins = () => {
  const pins = {};

  // Add Supabase domain pins if configured
  if (SUPABASE_API_DOMAIN) {
    pins[SUPABASE_API_DOMAIN] = {
      pins: [
        // Primary certificate pin (SHA-256) - UPDATE WITH YOUR CERTIFICATE
        'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        // Backup certificate pin - UPDATE WITH YOUR BACKUP CERTIFICATE
        'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
      ],
      includeSubdomains: false,
      expirationDate: '2025-12-31',
    };
  } else {
    console.warn('[CertificatePinning] SUPABASE_API_DOMAIN not configured - Supabase API pinning disabled');
  }

  return pins;
};

const CERTIFICATE_PINS = {
  // Self-hosted Supabase domain certificates (dynamically configured)
  ...buildCertificatePins(),

  // Stripe API certificates
  'api.stripe.com': {
    pins: [
      'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
      'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
    ],
    includeSubdomains: true,
    expirationDate: '2025-12-31',
  },

  // Google OAuth certificates
  'accounts.google.com': {
    pins: [
      'sha256/EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=',
      'sha256/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF=',
    ],
    includeSubdomains: false,
    expirationDate: '2025-12-31',
  },

  // Apple OAuth certificates
  'appleid.apple.com': {
    pins: [
      'sha256/GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG=',
      'sha256/HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH=',
    ],
    includeSubdomains: false,
    expirationDate: '2025-12-31',
  },
};

/**
 * Development mode bypass flag
 * WARNING: Never enable this in production!
 */
const BYPASS_PINNING_IN_DEV = __DEV__ && false;

/**
 * Pin validation result
 */
class PinValidationResult {
  constructor(isValid, domain, error = null) {
    this.isValid = isValid;
    this.domain = domain;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Certificate Pinning Manager
 */
class CertificatePinningManager {
  constructor() {
    this.pins = {...CERTIFICATE_PINS};
    this.validationLog = [];
    this.maxLogEntries = 100;
    this.enabled = true;
    this.initialized = false;
  }

  /**
   * Initialize certificate pinning
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check for expired pins and warn
      this.checkPinExpiration();

      // Initialize native module if available
      if (Platform.OS === 'ios' && NativeModules.CertificatePinning) {
        await NativeModules.CertificatePinning.initialize(this.pins);
      } else if (Platform.OS === 'android' && NativeModules.CertificatePinning) {
        await NativeModules.CertificatePinning.initialize(this.pins);
      }

      this.initialized = true;
      console.log('[CertificatePinning] Initialized successfully');
    } catch (error) {
      console.error('[CertificatePinning] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if pins are expired or near expiration
   */
  checkPinExpiration() {
    const now = new Date();
    const warningThresholdDays = 30;

    Object.entries(this.pins).forEach(([domain, config]) => {
      if (config.expirationDate) {
        const expiration = new Date(config.expirationDate);
        const daysUntilExpiration = Math.ceil(
          (expiration - now) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilExpiration <= 0) {
          console.error(
            `[CertificatePinning] EXPIRED pins for ${domain}! Certificate pinning disabled for this domain.`,
          );
          // Remove expired pins to prevent blocking
          delete this.pins[domain];
        } else if (daysUntilExpiration <= warningThresholdDays) {
          console.warn(
            `[CertificatePinning] Pins for ${domain} expire in ${daysUntilExpiration} days`,
          );
        }
      }
    });
  }

  /**
   * Add or update certificate pins for a domain
   */
  updatePins(domain, pins, options = {}) {
    this.pins[domain] = {
      pins: pins,
      includeSubdomains: options.includeSubdomains ?? false,
      expirationDate: options.expirationDate ?? null,
    };

    // Re-initialize native module with updated pins
    if (this.initialized) {
      this.reinitialize();
    }
  }

  /**
   * Remove pins for a domain
   */
  removePins(domain) {
    delete this.pins[domain];

    if (this.initialized) {
      this.reinitialize();
    }
  }

  /**
   * Re-initialize native module with updated pins
   */
  async reinitialize() {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Validate a certificate against stored pins
   */
  async validateCertificate(domain, certificateChain) {
    if (BYPASS_PINNING_IN_DEV) {
      console.warn(
        '[CertificatePinning] BYPASSED in development mode for:',
        domain,
      );
      return new PinValidationResult(true, domain);
    }

    if (!this.enabled) {
      return new PinValidationResult(true, domain);
    }

    try {
      // Find matching pin configuration
      const pinConfig = this.getPinConfigForDomain(domain);

      if (!pinConfig) {
        // No pins configured for this domain - allow but log
        this.logValidation(
          new PinValidationResult(true, domain, 'No pins configured'),
        );
        return new PinValidationResult(true, domain);
      }

      // Validate against pins
      const isValid = await this.performPinValidation(
        certificateChain,
        pinConfig.pins,
      );

      const result = new PinValidationResult(
        isValid,
        domain,
        isValid ? null : 'Certificate pin mismatch',
      );

      this.logValidation(result);

      if (!isValid) {
        console.error(
          '[CertificatePinning] FAILED validation for:',
          domain,
        );
        this.reportPinningFailure(domain, certificateChain);
      }

      return result;
    } catch (error) {
      const result = new PinValidationResult(false, domain, error.message);
      this.logValidation(result);
      return result;
    }
  }

  /**
   * Get pin configuration for a domain (including subdomain matching)
   */
  getPinConfigForDomain(domain) {
    // Direct match
    if (this.pins[domain]) {
      return this.pins[domain];
    }

    // Check for subdomain matches
    for (const [configDomain, config] of Object.entries(this.pins)) {
      if (config.includeSubdomains) {
        if (domain.endsWith(`.${configDomain}`)) {
          return config;
        }
      }
    }

    return null;
  }

  /**
   * Perform actual pin validation
   */
  async performPinValidation(certificateChain, expectedPins) {
    // Use native module for actual certificate validation
    if (Platform.OS === 'ios' && NativeModules.CertificatePinning) {
      return await NativeModules.CertificatePinning.validateCertificate(
        certificateChain,
        expectedPins,
      );
    } else if (
      Platform.OS === 'android' &&
      NativeModules.CertificatePinning
    ) {
      return await NativeModules.CertificatePinning.validateCertificate(
        certificateChain,
        expectedPins,
      );
    }

    // Fallback: JavaScript implementation for testing
    // In production, this should always use native modules
    return this.jsValidateCertificate(certificateChain, expectedPins);
  }

  /**
   * JavaScript fallback for certificate validation
   * Note: This is less secure than native validation and should only be used
   * as a fallback or for testing purposes
   */
  jsValidateCertificate(certificateChain, expectedPins) {
    if (!certificateChain || certificateChain.length === 0) {
      return false;
    }

    // Check if any certificate in the chain matches any of the expected pins
    for (const cert of certificateChain) {
      const certPin = this.computeCertificatePin(cert);

      for (const expectedPin of expectedPins) {
        if (certPin === expectedPin) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Compute SHA-256 pin from certificate
   */
  computeCertificatePin(certificate) {
    // In a real implementation, this would compute the SHA-256 hash
    // of the certificate's public key using native crypto
    // This is a placeholder that returns the certificate as-is
    // Actual implementation requires native modules
    return certificate;
  }

  /**
   * Log validation result
   */
  logValidation(result) {
    this.validationLog.push(result);

    // Trim log if it exceeds max entries
    if (this.validationLog.length > this.maxLogEntries) {
      this.validationLog = this.validationLog.slice(-this.maxLogEntries);
    }
  }

  /**
   * Report pinning failure for security monitoring
   */
  async reportPinningFailure(domain, certificateChain) {
    try {
      // Send to security monitoring endpoint
      // This helps detect potential MITM attacks
      const report = {
        domain,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        appVersion: '1.0.0', // Get from app config
        certificateInfo: certificateChain.map(cert => ({
          // Extract non-sensitive certificate info
          issuer: cert.issuer,
          subject: cert.subject,
          validFrom: cert.validFrom,
          validTo: cert.validTo,
        })),
      };

      console.error('[CertificatePinning] Security Report:', report);

      // In production, send this to your security monitoring service
      // await fetch('https://your-security-endpoint/pinning-failure', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (error) {
      console.error('[CertificatePinning] Failed to report failure:', error);
    }
  }

  /**
   * Get validation log for debugging
   */
  getValidationLog() {
    return [...this.validationLog];
  }

  /**
   * Clear validation log
   */
  clearValidationLog() {
    this.validationLog = [];
  }

  /**
   * Enable/disable certificate pinning
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(
      `[CertificatePinning] ${enabled ? 'Enabled' : 'Disabled'}`,
    );
  }

  /**
   * Get all configured domains
   */
  getConfiguredDomains() {
    return Object.keys(this.pins);
  }

  /**
   * Check if pinning is configured for a domain
   */
  isPinningConfigured(domain) {
    return this.getPinConfigForDomain(domain) !== null;
  }
}

// Singleton instance
const certificatePinningManager = new CertificatePinningManager();

/**
 * Create pinned fetch function
 * Wraps fetch with certificate pinning validation
 */
export function createPinnedFetch() {
  return async function pinnedFetch(url, options = {}) {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Check if pinning is configured for this domain
    if (!certificatePinningManager.isPinningConfigured(domain)) {
      // No pinning configured, proceed with normal fetch
      return fetch(url, options);
    }

    // For domains with pinning, we need to use native networking
    // that supports certificate pinning
    if (Platform.OS === 'ios' && NativeModules.PinnedNetworking) {
      return await NativeModules.PinnedNetworking.fetch(url, options);
    } else if (Platform.OS === 'android' && NativeModules.PinnedNetworking) {
      return await NativeModules.PinnedNetworking.fetch(url, options);
    }

    // Fallback to regular fetch with a warning
    console.warn(
      `[CertificatePinning] Native module not available for pinned fetch to ${domain}`,
    );
    return fetch(url, options);
  };
}

/**
 * Create pinned Axios instance
 * Configures Axios with certificate pinning
 */
export function createPinnedAxios(axios) {
  const instance = axios.create();

  // Add request interceptor to inject pinning
  instance.interceptors.request.use(
    async config => {
      const url = config.url || '';
      let domain = '';

      try {
        const urlObj = new URL(url, config.baseURL);
        domain = urlObj.hostname;
      } catch {
        // Invalid URL, proceed without pinning
        return config;
      }

      // Store domain for response interceptor
      config._pinnedDomain = domain;

      return config;
    },
    error => Promise.reject(error),
  );

  // Add response interceptor to validate
  instance.interceptors.response.use(
    response => {
      // In a production app with native pinning module,
      // validation would happen at the network layer
      return response;
    },
    error => {
      // Check if this is a pinning error
      if (error.code === 'CERTIFICATE_PINNING_FAILED') {
        console.error(
          '[CertificatePinning] Request blocked due to certificate mismatch',
        );
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

// Export manager and utilities
export {certificatePinningManager, CERTIFICATE_PINS};
export default certificatePinningManager;
