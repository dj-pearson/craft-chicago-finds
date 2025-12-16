/**
 * Consent Management System
 * Handles GDPR/CCPA cookie consent and user preferences
 */

import { supabase } from '@/integrations/supabase/client';

// Consent categories following IAB TCF 2.0 and GDPR requirements
export type ConsentCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

export interface ConsentPreference {
  category: ConsentCategory;
  purpose: string;
  vendorName?: string;
  enabled: boolean;
}

export interface ConsentState {
  essential: boolean; // Always true - required for site operation
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

export interface ConsentConfig {
  version: string;
  expirationDays: number;
  categories: {
    [key in ConsentCategory]: {
      title: string;
      description: string;
      required: boolean;
      vendors: Array<{
        name: string;
        purpose: string;
        policyUrl?: string;
      }>;
    };
  };
}

// Default consent configuration
export const CONSENT_CONFIG: ConsentConfig = {
  version: '1.0',
  expirationDays: 365,
  categories: {
    essential: {
      title: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms.',
      required: true,
      vendors: [
        { name: 'Supabase', purpose: 'Authentication and database', policyUrl: 'https://supabase.com/privacy' },
        { name: 'Cloudflare', purpose: 'Security and performance', policyUrl: 'https://www.cloudflare.com/privacypolicy/' },
      ],
    },
    functional: {
      title: 'Functional Cookies',
      description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.',
      required: false,
      vendors: [
        { name: 'Theme Preferences', purpose: 'Remember your display preferences' },
        { name: 'Language Settings', purpose: 'Remember your language preference' },
      ],
    },
    analytics: {
      title: 'Analytics Cookies',
      description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.',
      required: false,
      vendors: [
        { name: 'Google Analytics 4', purpose: 'Website analytics and performance', policyUrl: 'https://policies.google.com/privacy' },
      ],
    },
    marketing: {
      title: 'Marketing Cookies',
      description: 'These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.',
      required: false,
      vendors: [
        { name: 'Stripe', purpose: 'Payment processing and fraud prevention', policyUrl: 'https://stripe.com/privacy' },
      ],
    },
  },
};

const CONSENT_STORAGE_KEY = 'craft_local_consent';
const CONSENT_ID_KEY = 'craft_local_consent_id';

// Generate anonymous ID for non-authenticated users
function generateAnonymousId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'anon_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get or create anonymous ID
export function getAnonymousId(): string {
  let id = localStorage.getItem(CONSENT_ID_KEY);
  if (!id) {
    id = generateAnonymousId();
    localStorage.setItem(CONSENT_ID_KEY, id);
  }
  return id;
}

// Hash data for privacy (IP, user agent)
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get default consent state (all off except essential)
export function getDefaultConsentState(): ConsentState {
  return {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
    version: CONSENT_CONFIG.version,
  };
}

// Get consent state from localStorage
export function getStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as ConsentState;

    // Check if consent has expired (365 days)
    const expirationMs = CONSENT_CONFIG.expirationDays * 24 * 60 * 60 * 1000;
    if (Date.now() - consent.timestamp > expirationMs) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    // Check if version matches (re-consent needed if version changed)
    if (consent.version !== CONSENT_CONFIG.version) {
      return null;
    }

    return consent;
  } catch {
    return null;
  }
}

// Save consent state to localStorage
export function saveConsentToStorage(consent: ConsentState): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
}

// Check if user has given consent
export function hasConsentBeenGiven(): boolean {
  return getStoredConsent() !== null;
}

// Check consent for a specific category
export function hasConsentFor(category: ConsentCategory): boolean {
  const consent = getStoredConsent();
  if (!consent) return category === 'essential';
  return consent[category] ?? false;
}

// Save consent to database
export async function saveConsentToDatabase(
  consent: ConsentState,
  userId?: string,
  method: 'banner' | 'settings' | 'api' = 'banner'
): Promise<void> {
  try {
    const anonymousId = userId ? null : getAnonymousId();
    const userAgent = navigator.userAgent;
    const userAgentHash = await hashData(userAgent);

    // Get IP hash (we'll use a placeholder as we can't access IP directly in browser)
    // In production, this would be set by the server
    const ipHash = await hashData('client-side');

    // First, check if consent record exists
    const existingQuery = userId
      ? supabase.from('user_consents').select('id').eq('user_id', userId).single()
      : supabase.from('user_consents').select('id').eq('anonymous_id', anonymousId).single();

    const { data: existing } = await existingQuery;

    const consentData = {
      user_id: userId || null,
      anonymous_id: anonymousId,
      consent_type: consent.analytics && consent.marketing ? 'all' :
                    consent.analytics ? 'analytics' :
                    consent.functional ? 'functional' : 'essential',
      consented: consent.analytics || consent.functional || consent.marketing,
      consent_version: consent.version,
      ip_address_hash: ipHash,
      user_agent_hash: userAgentHash,
      consent_method: method,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CONSENT_CONFIG.expirationDays * 24 * 60 * 60 * 1000).toISOString(),
    };

    let consentId: string;

    if (existing?.id) {
      // Update existing consent
      const { error } = await supabase
        .from('user_consents')
        .update(consentData)
        .eq('id', existing.id);

      if (error) throw error;
      consentId = existing.id;
    } else {
      // Insert new consent
      const { data, error } = await supabase
        .from('user_consents')
        .insert(consentData)
        .select('id')
        .single();

      if (error) throw error;
      consentId = data.id;
    }

    // Save individual preferences
    const preferences: ConsentPreference[] = [
      { category: 'essential', purpose: 'Site operation', enabled: true },
      { category: 'functional', purpose: 'Enhanced functionality', enabled: consent.functional },
      { category: 'analytics', purpose: 'Site analytics', enabled: consent.analytics },
      { category: 'marketing', purpose: 'Marketing and advertising', enabled: consent.marketing },
    ];

    // Delete existing preferences and insert new ones
    await supabase.from('consent_preferences').delete().eq('consent_id', consentId);

    for (const pref of preferences) {
      await supabase.from('consent_preferences').insert({
        consent_id: consentId,
        category: pref.category,
        purpose: pref.purpose,
        enabled: pref.enabled,
      });
    }
  } catch (error) {
    console.error('Error saving consent to database:', error);
    // Don't throw - consent should still work with localStorage only
  }
}

// Update consent state
export async function updateConsent(
  updates: Partial<Omit<ConsentState, 'essential' | 'timestamp' | 'version'>>,
  userId?: string
): Promise<ConsentState> {
  const current = getStoredConsent() || getDefaultConsentState();

  const newConsent: ConsentState = {
    ...current,
    ...updates,
    essential: true, // Always true
    timestamp: Date.now(),
    version: CONSENT_CONFIG.version,
  };

  saveConsentToStorage(newConsent);
  await saveConsentToDatabase(newConsent, userId, 'settings');

  // Trigger consent change event for other parts of the app
  window.dispatchEvent(new CustomEvent('consentChanged', { detail: newConsent }));

  return newConsent;
}

// Accept all cookies
export async function acceptAllCookies(userId?: string): Promise<ConsentState> {
  const consent: ConsentState = {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
    version: CONSENT_CONFIG.version,
  };

  saveConsentToStorage(consent);
  await saveConsentToDatabase(consent, userId, 'banner');

  window.dispatchEvent(new CustomEvent('consentChanged', { detail: consent }));

  return consent;
}

// Accept only essential cookies
export async function acceptEssentialOnly(userId?: string): Promise<ConsentState> {
  const consent = getDefaultConsentState();

  saveConsentToStorage(consent);
  await saveConsentToDatabase(consent, userId, 'banner');

  window.dispatchEvent(new CustomEvent('consentChanged', { detail: consent }));

  return consent;
}

// Revoke all non-essential consent
export async function revokeConsent(userId?: string): Promise<ConsentState> {
  const consent = getDefaultConsentState();

  saveConsentToStorage(consent);
  await saveConsentToDatabase(consent, userId, 'settings');

  // Clear any third-party cookies/data that we control
  clearThirdPartyData();

  window.dispatchEvent(new CustomEvent('consentChanged', { detail: consent }));

  return consent;
}

// Clear third-party cookies and data
function clearThirdPartyData(): void {
  // Clear GA cookies
  const gaCookies = document.cookie.split(';').filter(c =>
    c.trim().startsWith('_ga') || c.trim().startsWith('_gid')
  );

  gaCookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
  });

  // Clear other tracking data from localStorage
  const keysToRemove = ['_ga', '_gid', 'ajs_user_id', 'ajs_anonymous_id'];
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Check if analytics should be enabled
export function isAnalyticsEnabled(): boolean {
  return hasConsentFor('analytics');
}

// Check if marketing should be enabled
export function isMarketingEnabled(): boolean {
  return hasConsentFor('marketing');
}

// Get consent for GPC (Global Privacy Control) signal
export function hasGPCSignal(): boolean {
  // @ts-ignore - GPC is not in TypeScript types yet
  return navigator.globalPrivacyControl === true;
}

// Check if user is from California (for CCPA)
export function isCaliforniaUser(): boolean {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone.includes('Los_Angeles') || timezone.includes('America/Los_Angeles');
  } catch {
    return false;
  }
}

// Check if user is from EU (for GDPR)
export function isEUUser(): boolean {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/', 'Atlantic/Azores', 'Atlantic/Canary', 'Atlantic/Faroe',
      'Atlantic/Madeira', 'Atlantic/Reykjavik'
    ];
    return euTimezones.some(tz => timezone.includes(tz));
  } catch {
    return false;
  }
}

// Get applicable regulations for user
export function getApplicableRegulations(): string[] {
  const regulations: string[] = [];

  if (isEUUser()) regulations.push('GDPR');
  if (isCaliforniaUser()) regulations.push('CCPA');
  if (hasGPCSignal()) regulations.push('GPC');

  return regulations;
}
