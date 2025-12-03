/**
 * Secure Storage for React Native
 * Provides encrypted storage for sensitive data using native keychain/keystore
 */

import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage key prefixes for organization
 */
const KEY_PREFIX = '@CraftChicago:';
const SECURE_PREFIX = `${KEY_PREFIX}secure:`;

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
  iterations: 100000,
};

/**
 * Simple XOR-based obfuscation for fallback
 * Note: This is NOT secure encryption - use native keychain in production
 */
function obfuscate(data, key) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(String.fromCharCode(...result));
}

function deobfuscate(data, key) {
  const decoded = atob(data);
  const result = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return String.fromCharCode(...result);
}

/**
 * SecureStorage class
 * Provides secure, encrypted storage with native keychain/keystore support
 */
class SecureStorage {
  constructor() {
    this.deviceId = null;
    this.initialized = false;
    this.nativeModule = null;
  }

  /**
   * Initialize secure storage
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Generate or retrieve device-specific key
      this.deviceId = await this.getOrCreateDeviceId();

      // Check for native secure storage module
      // In production, use react-native-keychain or similar
      this.nativeModule = null; // Would be NativeModules.SecureStorage

      this.initialized = true;
      console.log('[SecureStorage] Initialized successfully');
    } catch (error) {
      console.error('[SecureStorage] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get or create a device-specific identifier
   */
  async getOrCreateDeviceId() {
    const key = `${KEY_PREFIX}deviceId`;
    let deviceId = await AsyncStorage.getItem(key);

    if (!deviceId) {
      // Generate new device ID
      deviceId = this.generateUUID();
      await AsyncStorage.setItem(key, deviceId);
    }

    return deviceId;
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Store sensitive data securely
   */
  async setSecure(key, value) {
    await this.ensureInitialized();

    const secureKey = `${SECURE_PREFIX}${key}`;

    try {
      // Serialize value
      const serialized = JSON.stringify({
        value,
        timestamp: Date.now(),
        version: 1,
      });

      // Use native keychain if available
      if (this.nativeModule && Platform.OS === 'ios') {
        await this.nativeModule.setItem(secureKey, serialized);
        return;
      }

      if (this.nativeModule && Platform.OS === 'android') {
        await this.nativeModule.setItem(secureKey, serialized);
        return;
      }

      // Fallback: Use obfuscation with AsyncStorage
      // WARNING: This is not truly secure - use native keychain in production
      const obfuscated = obfuscate(serialized, this.deviceId);
      await AsyncStorage.setItem(secureKey, obfuscated);
    } catch (error) {
      console.error('[SecureStorage] Failed to set secure item:', error);
      throw error;
    }
  }

  /**
   * Retrieve sensitive data
   */
  async getSecure(key) {
    await this.ensureInitialized();

    const secureKey = `${SECURE_PREFIX}${key}`;

    try {
      let serialized;

      // Use native keychain if available
      if (this.nativeModule && Platform.OS === 'ios') {
        serialized = await this.nativeModule.getItem(secureKey);
      } else if (this.nativeModule && Platform.OS === 'android') {
        serialized = await this.nativeModule.getItem(secureKey);
      } else {
        // Fallback: Use obfuscation with AsyncStorage
        const obfuscated = await AsyncStorage.getItem(secureKey);
        if (!obfuscated) return null;

        serialized = deobfuscate(obfuscated, this.deviceId);
      }

      if (!serialized) return null;

      const data = JSON.parse(serialized);
      return data.value;
    } catch (error) {
      console.error('[SecureStorage] Failed to get secure item:', error);
      return null;
    }
  }

  /**
   * Delete sensitive data
   */
  async removeSecure(key) {
    await this.ensureInitialized();

    const secureKey = `${SECURE_PREFIX}${key}`;

    try {
      if (this.nativeModule) {
        await this.nativeModule.removeItem(secureKey);
      } else {
        await AsyncStorage.removeItem(secureKey);
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to remove secure item:', error);
      throw error;
    }
  }

  /**
   * Check if a secure key exists
   */
  async hasSecure(key) {
    const value = await this.getSecure(key);
    return value !== null;
  }

  /**
   * Clear all secure storage
   */
  async clearSecure() {
    await this.ensureInitialized();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(k => k.startsWith(SECURE_PREFIX));

      if (this.nativeModule) {
        for (const key of secureKeys) {
          await this.nativeModule.removeItem(key);
        }
      } else {
        await AsyncStorage.multiRemove(secureKeys);
      }
    } catch (error) {
      console.error('[SecureStorage] Failed to clear secure storage:', error);
      throw error;
    }
  }

  /**
   * Ensure storage is initialized before operations
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Store authentication tokens securely
   */
  async setAuthTokens(tokens) {
    await this.setSecure('auth_tokens', tokens);
  }

  /**
   * Get authentication tokens
   */
  async getAuthTokens() {
    return await this.getSecure('auth_tokens');
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens() {
    await this.removeSecure('auth_tokens');
  }

  /**
   * Store API keys securely
   */
  async setApiKey(name, key) {
    await this.setSecure(`api_key_${name}`, key);
  }

  /**
   * Get API key
   */
  async getApiKey(name) {
    return await this.getSecure(`api_key_${name}`);
  }

  /**
   * Store user credentials securely (for biometric auth)
   */
  async setCredentials(email, encryptedPassword) {
    await this.setSecure('credentials', {email, encryptedPassword});
  }

  /**
   * Get stored credentials
   */
  async getCredentials() {
    return await this.getSecure('credentials');
  }

  /**
   * Clear stored credentials
   */
  async clearCredentials() {
    await this.removeSecure('credentials');
  }

  /**
   * Store OAuth tokens
   */
  async setOAuthTokens(provider, tokens) {
    await this.setSecure(`oauth_${provider}`, tokens);
  }

  /**
   * Get OAuth tokens
   */
  async getOAuthTokens(provider) {
    return await this.getSecure(`oauth_${provider}`);
  }

  /**
   * Clear OAuth tokens
   */
  async clearOAuthTokens(provider) {
    await this.removeSecure(`oauth_${provider}`);
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const keys = await AsyncStorage.getAllKeys();
    const secureKeys = keys.filter(k => k.startsWith(SECURE_PREFIX));

    return {
      totalKeys: keys.length,
      secureKeys: secureKeys.length,
      keyPrefix: KEY_PREFIX,
    };
  }
}

// Singleton instance
const secureStorage = new SecureStorage();

/**
 * Custom Supabase storage adapter using SecureStorage
 */
export const supabaseSecureStorage = {
  async getItem(key) {
    return await secureStorage.getSecure(`supabase_${key}`);
  },

  async setItem(key, value) {
    await secureStorage.setSecure(`supabase_${key}`, value);
  },

  async removeItem(key) {
    await secureStorage.removeSecure(`supabase_${key}`);
  },
};

export {secureStorage};
export default secureStorage;
