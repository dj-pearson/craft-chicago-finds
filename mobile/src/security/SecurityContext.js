/**
 * Security Context for React Native
 * Centralizes security features: certificate pinning, secure storage, session management
 */

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import {AppState, Platform} from 'react-native';
import certificatePinningManager from './certificatePinning';
import secureStorage from './secureStorage';

/**
 * Security configuration defaults
 */
const DEFAULT_CONFIG = {
  // Session timeout in milliseconds (30 minutes)
  sessionTimeoutMs: 30 * 60 * 1000,
  // Warning before timeout (5 minutes)
  sessionWarningMs: 5 * 60 * 1000,
  // Background timeout (5 minutes - lock on background)
  backgroundTimeoutMs: 5 * 60 * 1000,
  // Enable certificate pinning
  enableCertificatePinning: true,
  // Enable secure storage
  enableSecureStorage: true,
  // Enable biometric authentication
  enableBiometrics: false,
  // Enable jailbreak/root detection
  enableJailbreakDetection: true,
  // Enable debug detection
  enableDebugDetection: !__DEV__,
};

/**
 * Security Context
 */
const SecurityContext = createContext({
  isInitialized: false,
  isSecure: true,
  securityWarnings: [],
  sessionActive: true,
  sessionTimeRemaining: null,
  lockApp: () => {},
  unlockApp: () => {},
  resetSessionTimer: () => {},
  validateCertificate: async () => ({isValid: true}),
  secureStorage: null,
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
});

/**
 * Security Provider Component
 */
export function SecurityProvider({children, config: customConfig = {}}) {
  const config = {...DEFAULT_CONFIG, ...customConfig};

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [appState, setAppState] = useState(AppState.currentState);
  const [backgroundTime, setBackgroundTime] = useState(null);

  /**
   * Initialize security features
   */
  useEffect(() => {
    async function initializeSecurity() {
      const warnings = [];

      try {
        // Initialize certificate pinning
        if (config.enableCertificatePinning) {
          await certificatePinningManager.initialize();
        }

        // Initialize secure storage
        if (config.enableSecureStorage) {
          await secureStorage.initialize();
        }

        // Check for jailbreak/root
        if (config.enableJailbreakDetection) {
          const isCompromised = await checkDeviceCompromised();
          if (isCompromised) {
            warnings.push({
              type: 'device_compromised',
              severity: 'critical',
              message: 'Device may be jailbroken or rooted',
            });
            setIsSecure(false);
          }
        }

        // Check for debug mode in production
        if (config.enableDebugDetection && !__DEV__) {
          const isDebugMode = await checkDebugMode();
          if (isDebugMode) {
            warnings.push({
              type: 'debug_detected',
              severity: 'high',
              message: 'App running in debug mode',
            });
          }
        }

        // Check for emulator
        const isEmulator = await checkEmulator();
        if (isEmulator && !__DEV__) {
          warnings.push({
            type: 'emulator_detected',
            severity: 'medium',
            message: 'App running on emulator',
          });
        }

        setSecurityWarnings(warnings);
        setIsInitialized(true);
        console.log('[Security] Initialized successfully');
      } catch (error) {
        console.error('[Security] Initialization error:', error);
        warnings.push({
          type: 'init_error',
          severity: 'high',
          message: 'Security initialization failed',
        });
        setSecurityWarnings(warnings);
        setIsInitialized(true);
      }
    }

    initializeSecurity();
  }, []);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/active/) && nextAppState === 'background') {
        // App going to background
        setBackgroundTime(Date.now());
        console.log('[Security] App moved to background');
      } else if (
        appState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground
        if (backgroundTime) {
          const timeInBackground = Date.now() - backgroundTime;
          console.log(
            `[Security] App returned from background after ${timeInBackground}ms`,
          );

          // Check if session should be locked
          if (timeInBackground > config.backgroundTimeoutMs) {
            lockApp('background_timeout');
          }
        }
        setBackgroundTime(null);
        resetSessionTimer();
      }
      setAppState(nextAppState);
    });

    return () => subscription.remove();
  }, [appState, backgroundTime, config.backgroundTimeoutMs]);

  /**
   * Session timeout monitoring
   */
  useEffect(() => {
    if (!sessionActive || !isInitialized) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = config.sessionTimeoutMs - elapsed;

      setSessionTimeRemaining(Math.max(0, remaining));

      // Show warning
      if (remaining <= config.sessionWarningMs && remaining > 0) {
        // Session about to expire
      }

      // Session expired
      if (remaining <= 0) {
        lockApp('session_timeout');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    sessionActive,
    lastActivity,
    isInitialized,
    config.sessionTimeoutMs,
    config.sessionWarningMs,
  ]);

  /**
   * Lock the app
   */
  const lockApp = useCallback(reason => {
    console.log('[Security] App locked:', reason);
    setSessionActive(false);

    // Log security event
    logSecurityEvent('app_locked', {reason});
  }, []);

  /**
   * Unlock the app
   */
  const unlockApp = useCallback(async () => {
    console.log('[Security] App unlocked');
    setSessionActive(true);
    setLastActivity(Date.now());

    // Log security event
    logSecurityEvent('app_unlocked', {});
  }, []);

  /**
   * Reset session timer on user activity
   */
  const resetSessionTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  /**
   * Validate certificate for a domain
   */
  const validateCertificate = useCallback(
    async (domain, certificateChain) => {
      if (!config.enableCertificatePinning) {
        return {isValid: true};
      }

      return await certificatePinningManager.validateCertificate(
        domain,
        certificateChain,
      );
    },
    [config.enableCertificatePinning],
  );

  /**
   * Update security configuration
   */
  const updateConfig = useCallback(newConfig => {
    Object.assign(config, newConfig);
  }, []);

  const value = {
    isInitialized,
    isSecure,
    securityWarnings,
    sessionActive,
    sessionTimeRemaining,
    lockApp,
    unlockApp,
    resetSessionTimer,
    validateCertificate,
    secureStorage,
    config,
    updateConfig,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Hook to access security context
 */
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

/**
 * Check if device is jailbroken/rooted
 */
async function checkDeviceCompromised() {
  // In production, use react-native-jail-monkey or similar
  // This is a simplified check
  try {
    if (Platform.OS === 'ios') {
      // Check for common jailbreak indicators
      const jailbreakPaths = [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
        '/private/var/lib/apt/',
      ];

      // In production, check these paths using native modules
      return false;
    } else if (Platform.OS === 'android') {
      // Check for common root indicators
      const rootPaths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
      ];

      // In production, check these paths using native modules
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if app is running in debug mode
 */
async function checkDebugMode() {
  // In production, use native modules to detect debugger attachment
  return __DEV__;
}

/**
 * Check if app is running on an emulator
 */
async function checkEmulator() {
  // In production, use react-native-device-info or native detection
  return false;
}

/**
 * Log security event
 */
async function logSecurityEvent(eventType, details) {
  try {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      details,
    };

    // Store locally
    const logs = (await secureStorage.getSecure('security_logs')) || [];
    logs.push(event);

    // Keep only last 100 events
    if (logs.length > 100) {
      logs.shift();
    }

    await secureStorage.setSecure('security_logs', logs);
  } catch (error) {
    console.error('[Security] Failed to log event:', error);
  }
}

/**
 * Higher-order component to require security initialization
 */
export function withSecurity(WrappedComponent) {
  return function SecurityWrappedComponent(props) {
    const {isInitialized, isSecure, sessionActive} = useSecurity();

    if (!isInitialized) {
      // Show loading screen while security initializes
      return null;
    }

    if (!isSecure) {
      // Show security warning screen
      return null;
    }

    if (!sessionActive) {
      // Show lock screen
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

export default SecurityContext;
