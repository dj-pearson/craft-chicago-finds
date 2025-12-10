/**
 * Consent Management Hook
 * Provides React integration for cookie consent management
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  ConsentState,
  ConsentCategory,
  ConsentConfig,
  CONSENT_CONFIG,
  getStoredConsent,
  getDefaultConsentState,
  hasConsentBeenGiven,
  hasConsentFor,
  updateConsent,
  acceptAllCookies,
  acceptEssentialOnly,
  revokeConsent,
  isAnalyticsEnabled,
  isMarketingEnabled,
  hasGPCSignal,
  isCaliforniaUser,
  isEUUser,
  getApplicableRegulations,
} from '@/lib/consent-management';

interface ConsentContextType {
  // State
  consent: ConsentState;
  hasConsented: boolean;
  showBanner: boolean;
  isLoading: boolean;

  // Config
  config: ConsentConfig;
  applicableRegulations: string[];

  // Actions
  acceptAll: () => Promise<void>;
  acceptEssentialOnly: () => Promise<void>;
  updatePreferences: (updates: Partial<Omit<ConsentState, 'essential' | 'timestamp' | 'version'>>) => Promise<void>;
  revokeAll: () => Promise<void>;
  openPreferences: () => void;
  closePreferences: () => void;
  closeBanner: () => void;

  // Utilities
  hasConsentFor: (category: ConsentCategory) => boolean;
  isAnalyticsEnabled: boolean;
  isMarketingEnabled: boolean;
  hasGPCSignal: boolean;
  isCaliforniaUser: boolean;
  isEUUser: boolean;

  // UI state
  showPreferences: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

interface ConsentProviderProps {
  children: ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentState>(getDefaultConsentState);
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize consent state
  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      setHasConsented(true);
      setShowBanner(false);
    } else {
      // Check for GPC signal - if set, don't track by default
      if (hasGPCSignal()) {
        setConsent(getDefaultConsentState());
        setHasConsented(false);
      }
      // Show banner after a brief delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
    setIsLoading(false);
  }, []);

  // Listen for consent changes from other sources
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent<ConsentState>) => {
      setConsent(event.detail);
      setHasConsented(true);
    };

    window.addEventListener('consentChanged', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('consentChanged', handleConsentChange as EventListener);
    };
  }, []);

  const handleAcceptAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const newConsent = await acceptAllCookies(user?.id);
      setConsent(newConsent);
      setHasConsented(true);
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleAcceptEssentialOnly = useCallback(async () => {
    setIsLoading(true);
    try {
      const newConsent = await acceptEssentialOnly(user?.id);
      setConsent(newConsent);
      setHasConsented(true);
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleUpdatePreferences = useCallback(async (
    updates: Partial<Omit<ConsentState, 'essential' | 'timestamp' | 'version'>>
  ) => {
    setIsLoading(true);
    try {
      const newConsent = await updateConsent(updates, user?.id);
      setConsent(newConsent);
      setHasConsented(true);
      setShowPreferences(false);
      setShowBanner(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleRevokeAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const newConsent = await revokeConsent(user?.id);
      setConsent(newConsent);
      // Keep hasConsented true since user made a choice
      setHasConsented(true);
      setShowPreferences(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const checkConsentFor = useCallback((category: ConsentCategory): boolean => {
    return consent[category] ?? false;
  }, [consent]);

  const value: ConsentContextType = {
    consent,
    hasConsented,
    showBanner,
    isLoading,
    config: CONSENT_CONFIG,
    applicableRegulations: getApplicableRegulations(),
    acceptAll: handleAcceptAll,
    acceptEssentialOnly: handleAcceptEssentialOnly,
    updatePreferences: handleUpdatePreferences,
    revokeAll: handleRevokeAll,
    openPreferences,
    closePreferences,
    closeBanner,
    hasConsentFor: checkConsentFor,
    isAnalyticsEnabled: consent.analytics,
    isMarketingEnabled: consent.marketing,
    hasGPCSignal: hasGPCSignal(),
    isCaliforniaUser: isCaliforniaUser(),
    isEUUser: isEUUser(),
    showPreferences,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextType {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

// Standalone hook for checking consent without full context
export function useConsentCheck(category: ConsentCategory): boolean {
  const [hasConsent, setHasConsent] = useState(() => hasConsentFor(category));

  useEffect(() => {
    const handleConsentChange = (event: CustomEvent<ConsentState>) => {
      setHasConsent(event.detail[category] ?? false);
    };

    window.addEventListener('consentChanged', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('consentChanged', handleConsentChange as EventListener);
    };
  }, [category]);

  return hasConsent;
}

// Hook for conditionally loading analytics
export function useAnalyticsConsent(): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState(() => isAnalyticsEnabled());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEnabled(isAnalyticsEnabled());
    setLoading(false);

    const handleConsentChange = (event: CustomEvent<ConsentState>) => {
      setEnabled(event.detail.analytics ?? false);
    };

    window.addEventListener('consentChanged', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('consentChanged', handleConsentChange as EventListener);
    };
  }, []);

  return { enabled, loading };
}
