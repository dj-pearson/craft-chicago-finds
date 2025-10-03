import { supabase } from '@/integrations/supabase/client';

export interface FraudSignal {
  id: string;
  type: 'velocity' | 'behavioral' | 'payment' | 'device' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-100
  metadata: Record<string, any>;
  timestamp: string;
  actionRequired: boolean;
}

export interface DeviceFingerprint {
  userAgent: string;
  screen: { width: number; height: number; colorDepth: number };
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  canvas?: string;
  webgl?: string;
}

export interface BehavioralPattern {
  mouseMovements: Array<{ x: number; y: number; timestamp: number }>;
  keystrokes: Array<{ key: string; timestamp: number; duration: number }>;
  scrollPattern: Array<{ scrollY: number; timestamp: number }>;
  clickPattern: Array<{ x: number; y: number; timestamp: number; element: string }>;
  pageViewDuration: number;
  interactionSpeed: number;
  typingCadence: number[];
}

export class FraudDetectionEngine {
  private static instance: FraudDetectionEngine;
  private behavioralData: BehavioralPattern | null = null;
  private deviceFingerprint: DeviceFingerprint | null = null;
  private sessionStartTime: number = Date.now();

  static getInstance(): FraudDetectionEngine {
    if (!FraudDetectionEngine.instance) {
      FraudDetectionEngine.instance = new FraudDetectionEngine();
    }
    return FraudDetectionEngine.instance;
  }

  /**
   * Initialize fraud detection for the current session
   */
  async initializeSession(userId?: string): Promise<void> {
    this.sessionStartTime = Date.now();
    this.deviceFingerprint = await this.generateDeviceFingerprint();
    this.startBehavioralTracking();
    
    if (userId) {
      await this.logSessionStart(userId);
    }
  }

  /**
   * Analyze a transaction for fraud signals
   */
  async analyzeTransaction(transactionData: {
    amount: number;
    userId: string;
    listingId: string;
    sellerId: string;
    paymentMethodId?: string;
    shippingAddress?: any;
  }): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    try {
      // 1. Transaction Velocity Analysis
      const velocitySignals = await this.analyzeTransactionVelocity(transactionData.userId, transactionData.amount);
      signals.push(...velocitySignals);

      // 2. Behavioral Analysis
      const behavioralSignals = await this.analyzeBehavioralPatterns(transactionData.userId);
      signals.push(...behavioralSignals);

      // 3. Device Fingerprint Analysis
      const deviceSignals = await this.analyzeDeviceFingerprint(transactionData.userId);
      signals.push(...deviceSignals);

      // 4. Pattern Recognition
      const patternSignals = await this.analyzeTransactionPatterns(transactionData);
      signals.push(...patternSignals);

      // 5. Amount-based Risk Assessment
      const amountSignals = await this.analyzeTransactionAmount(transactionData.amount, transactionData.userId);
      signals.push(...amountSignals);

      // Log all signals for ML training
      await this.logFraudSignals(transactionData.userId, signals);

      return signals;
    } catch (error) {
      console.error('Fraud analysis error:', error);
      return [{
        id: `error_${Date.now()}`,
        type: 'pattern',
        severity: 'medium',
        description: 'Fraud analysis temporarily unavailable',
        confidence: 50,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString(),
        actionRequired: false
      }];
    }
  }

  /**
   * Analyze transaction velocity patterns
   */
  private async analyzeTransactionVelocity(userId: string, amount: number): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Check transactions in last hour
      const { data: recentTransactions } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('buyer_id', userId)
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false });

      if (recentTransactions && recentTransactions.length > 0) {
        const transactionCount = recentTransactions.length;
        const totalAmount = recentTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

        // High frequency transactions
        if (transactionCount >= 5) {
          signals.push({
            id: `velocity_freq_${Date.now()}`,
            type: 'velocity',
            severity: 'high',
            description: `${transactionCount} transactions in the last hour`,
            confidence: 85,
            metadata: { transactionCount, timeWindow: '1hour' },
            timestamp: new Date().toISOString(),
            actionRequired: true
          });
        }

        // High amount velocity
        if (totalAmount > 1000) {
          signals.push({
            id: `velocity_amount_${Date.now()}`,
            type: 'velocity',
            severity: 'high',
            description: `$${totalAmount} spent in the last hour`,
            confidence: 80,
            metadata: { totalAmount, timeWindow: '1hour' },
            timestamp: new Date().toISOString(),
            actionRequired: true
          });
        }

        // Unusual amount pattern
        const avgAmount = totalAmount / transactionCount;
        if (amount > avgAmount * 5) {
          signals.push({
            id: `velocity_pattern_${Date.now()}`,
            type: 'velocity',
            severity: 'medium',
            description: `Transaction amount significantly higher than recent average`,
            confidence: 70,
            metadata: { currentAmount: amount, avgAmount, multiplier: amount / avgAmount },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      }

      // Check daily patterns
      const { data: dailyTransactions } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('buyer_id', userId)
        .gte('created_at', oneDayAgo.toISOString());

      if (dailyTransactions && dailyTransactions.length > 10) {
        signals.push({
          id: `velocity_daily_${Date.now()}`,
          type: 'velocity',
          severity: 'medium',
          description: `${dailyTransactions.length} transactions in 24 hours`,
          confidence: 75,
          metadata: { transactionCount: dailyTransactions.length, timeWindow: '24hours' },
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

    } catch (error) {
      console.error('Velocity analysis error:', error);
    }

    return signals;
  }

  /**
   * Analyze behavioral patterns for anomalies
   */
  private async analyzeBehavioralPatterns(userId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    if (!this.behavioralData) {
      return signals;
    }

    try {
      // Analyze interaction speed (too fast = bot)
      if (this.behavioralData.interactionSpeed > 10) { // More than 10 interactions per second
        signals.push({
          id: `behavioral_speed_${Date.now()}`,
          type: 'behavioral',
          severity: 'high',
          description: 'Unusually fast interaction patterns detected',
          confidence: 90,
          metadata: { interactionSpeed: this.behavioralData.interactionSpeed },
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      }

      // Analyze mouse movement patterns
      if (this.behavioralData.mouseMovements.length === 0 && this.behavioralData.clickPattern.length > 0) {
        signals.push({
          id: `behavioral_mouse_${Date.now()}`,
          type: 'behavioral',
          severity: 'medium',
          description: 'Clicks without mouse movements detected',
          confidence: 75,
          metadata: { 
            clicks: this.behavioralData.clickPattern.length,
            mouseMovements: this.behavioralData.mouseMovements.length 
          },
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

      // Analyze typing patterns
      if (this.behavioralData.typingCadence.length > 0) {
        const avgCadence = this.behavioralData.typingCadence.reduce((a, b) => a + b, 0) / this.behavioralData.typingCadence.length;
        const variance = this.behavioralData.typingCadence.reduce((sum, cadence) => sum + Math.pow(cadence - avgCadence, 2), 0) / this.behavioralData.typingCadence.length;
        
        // Very consistent typing (possible bot)
        if (variance < 10) {
          signals.push({
            id: `behavioral_typing_${Date.now()}`,
            type: 'behavioral',
            severity: 'medium',
            description: 'Unusually consistent typing pattern detected',
            confidence: 70,
            metadata: { avgCadence, variance },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      }

      // Page view duration analysis
      if (this.behavioralData.pageViewDuration < 5000) { // Less than 5 seconds
        signals.push({
          id: `behavioral_duration_${Date.now()}`,
          type: 'behavioral',
          severity: 'low',
          description: 'Very short page view duration before purchase',
          confidence: 60,
          metadata: { pageViewDuration: this.behavioralData.pageViewDuration },
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

    } catch (error) {
      console.error('Behavioral analysis error:', error);
    }

    return signals;
  }

  /**
   * Analyze device fingerprint for anomalies
   */
  private async analyzeDeviceFingerprint(userId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    if (!this.deviceFingerprint) {
      return signals;
    }

    try {
      // Check for known device
      const { data: knownDevices } = await supabase
        .from('user_device_fingerprints')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      if (knownDevices && knownDevices.length > 0) {
        const currentFingerprint = JSON.stringify(this.deviceFingerprint);
        const isKnownDevice = knownDevices.some(device => 
          JSON.stringify(device.fingerprint) === currentFingerprint
        );

        if (!isKnownDevice) {
          signals.push({
            id: `device_new_${Date.now()}`,
            type: 'device',
            severity: 'medium',
            description: 'Transaction from new/unknown device',
            confidence: 70,
            metadata: { 
              knownDeviceCount: knownDevices.length,
              currentDevice: this.deviceFingerprint 
            },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      }

      // Check for suspicious device characteristics
      if (!this.deviceFingerprint.cookieEnabled) {
        signals.push({
          id: `device_cookies_${Date.now()}`,
          type: 'device',
          severity: 'low',
          description: 'Cookies disabled on device',
          confidence: 50,
          metadata: { cookieEnabled: false },
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

      // Check for headless browser indicators
      if (this.deviceFingerprint.webgl === 'disabled' || this.deviceFingerprint.canvas === 'blocked') {
        signals.push({
          id: `device_headless_${Date.now()}`,
          type: 'device',
          severity: 'high',
          description: 'Possible headless browser or bot detected',
          confidence: 85,
          metadata: { 
            webgl: this.deviceFingerprint.webgl,
            canvas: this.deviceFingerprint.canvas 
          },
          timestamp: new Date().toISOString(),
          actionRequired: true
        });
      }

    } catch (error) {
      console.error('Device fingerprint analysis error:', error);
    }

    return signals;
  }

  /**
   * Analyze transaction patterns
   */
  private async analyzeTransactionPatterns(transactionData: any): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    try {
      // Check for round number amounts (common in fraud)
      if (transactionData.amount % 100 === 0 && transactionData.amount >= 500) {
        signals.push({
          id: `pattern_round_${Date.now()}`,
          type: 'pattern',
          severity: 'low',
          description: 'Round number transaction amount',
          confidence: 40,
          metadata: { amount: transactionData.amount },
          timestamp: new Date().toISOString(),
          actionRequired: false
        });
      }

      // Check for same seller pattern
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('seller_id')
        .eq('buyer_id', transactionData.userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentOrders) {
        const sameSeller = recentOrders.filter(order => order.seller_id === transactionData.sellerId);
        if (sameSeller.length >= 3) {
          signals.push({
            id: `pattern_seller_${Date.now()}`,
            type: 'pattern',
            severity: 'medium',
            description: 'Multiple purchases from same seller in 24 hours',
            confidence: 65,
            metadata: { 
              sellerId: transactionData.sellerId,
              purchaseCount: sameSeller.length 
            },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      }

    } catch (error) {
      console.error('Pattern analysis error:', error);
    }

    return signals;
  }

  /**
   * Analyze transaction amount for risk
   */
  private async analyzeTransactionAmount(amount: number, userId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    try {
      // Get user's transaction history
      const { data: userHistory } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (userHistory && userHistory.length > 0) {
        const amounts = userHistory.map(order => order.total_amount || 0);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const maxAmount = Math.max(...amounts);

        // Significantly higher than average
        if (amount > avgAmount * 10) {
          signals.push({
            id: `amount_high_${Date.now()}`,
            type: 'pattern',
            severity: 'high',
            description: 'Transaction amount significantly higher than user average',
            confidence: 80,
            metadata: { 
              currentAmount: amount,
              avgAmount,
              multiplier: amount / avgAmount 
            },
            timestamp: new Date().toISOString(),
            actionRequired: true
          });
        }

        // New maximum amount
        if (amount > maxAmount * 2) {
          signals.push({
            id: `amount_max_${Date.now()}`,
            type: 'pattern',
            severity: 'medium',
            description: 'Transaction amount is new maximum for user',
            confidence: 70,
            metadata: { 
              currentAmount: amount,
              previousMax: maxAmount 
            },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      } else {
        // First transaction - high amount
        if (amount > 500) {
          signals.push({
            id: `amount_first_${Date.now()}`,
            type: 'pattern',
            severity: 'medium',
            description: 'High-value first transaction for new user',
            confidence: 75,
            metadata: { amount, isFirstTransaction: true },
            timestamp: new Date().toISOString(),
            actionRequired: false
          });
        }
      }

    } catch (error) {
      console.error('Amount analysis error:', error);
    }

    return signals;
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    const fingerprint: DeviceFingerprint = {
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency
    };

    // Add device memory if available
    if ('deviceMemory' in navigator) {
      fingerprint.deviceMemory = (navigator as any).deviceMemory;
    }

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      fingerprint.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    // Generate canvas fingerprint
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
        fingerprint.canvas = canvas.toDataURL();
      }
    } catch (e) {
      fingerprint.canvas = 'blocked';
    }

    // Generate WebGL fingerprint
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        fingerprint.webgl = debugInfo ? 
          gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 
          'available';
      } else {
        fingerprint.webgl = 'disabled';
      }
    } catch (e) {
      fingerprint.webgl = 'blocked';
    }

    return fingerprint;
  }

  /**
   * Start behavioral tracking
   */
  private startBehavioralTracking(): void {
    this.behavioralData = {
      mouseMovements: [],
      keystrokes: [],
      scrollPattern: [],
      clickPattern: [],
      pageViewDuration: 0,
      interactionSpeed: 0,
      typingCadence: []
    };

    let interactionCount = 0;
    const startTime = Date.now();

    // Track mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      this.behavioralData?.mouseMovements.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
      interactionCount++;
    };

    // Track clicks
    const handleClick = (e: MouseEvent) => {
      this.behavioralData?.clickPattern.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
        element: (e.target as Element)?.tagName || 'unknown'
      });
      interactionCount++;
    };

    // Track scrolling
    const handleScroll = () => {
      this.behavioralData?.scrollPattern.push({
        scrollY: window.scrollY,
        timestamp: Date.now()
      });
      interactionCount++;
    };

    // Track keystrokes
    let lastKeyTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (lastKeyTime > 0) {
        this.behavioralData?.typingCadence.push(now - lastKeyTime);
      }
      
      this.behavioralData?.keystrokes.push({
        key: e.key.length === 1 ? 'char' : e.key, // Don't log actual characters for privacy
        timestamp: now,
        duration: 0
      });
      
      lastKeyTime = now;
      interactionCount++;
    };

    // Calculate interaction speed periodically
    const updateInteractionSpeed = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (this.behavioralData && elapsed > 0) {
        this.behavioralData.interactionSpeed = interactionCount / elapsed;
        this.behavioralData.pageViewDuration = Date.now() - this.sessionStartTime;
      }
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('keydown', handleKeyDown, { passive: true });

    // Update interaction speed every 5 seconds
    const intervalId = setInterval(updateInteractionSpeed, 5000);

    // Cleanup function
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(intervalId);
    };

    // Store cleanup function for later use
    (window as any).__fraudDetectionCleanup = cleanup;
  }

  /**
   * Log session start
   */
  private async logSessionStart(userId: string): Promise<void> {
    try {
      await supabase.from('fraud_detection_sessions').insert({
        user_id: userId,
        device_fingerprint: this.deviceFingerprint,
        session_start: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Session logging error:', error);
    }
  }

  /**
   * Log fraud signals for ML training
   */
  private async logFraudSignals(userId: string, signals: FraudSignal[]): Promise<void> {
    try {
      const signalsToLog = signals.map(signal => ({
        user_id: userId,
        signal_type: signal.type,
        severity: signal.severity,
        confidence: signal.confidence,
        description: signal.description,
        metadata: signal.metadata,
        action_required: signal.actionRequired,
        created_at: signal.timestamp
      }));

      await supabase.from('fraud_signals').insert(signalsToLog);
    } catch (error) {
      console.error('Signal logging error:', error);
    }
  }

  /**
   * Get fraud risk score (0-100)
   */
  calculateRiskScore(signals: FraudSignal[]): number {
    if (signals.length === 0) return 0;

    let totalScore = 0;
    let weightSum = 0;

    signals.forEach(signal => {
      let weight = 1;
      
      // Weight by severity
      switch (signal.severity) {
        case 'critical': weight = 4; break;
        case 'high': weight = 3; break;
        case 'medium': weight = 2; break;
        case 'low': weight = 1; break;
      }

      // Weight by confidence
      const confidenceWeight = signal.confidence / 100;
      
      totalScore += (signal.confidence * weight * confidenceWeight);
      weightSum += weight;
    });

    return Math.min(Math.round(totalScore / weightSum), 100);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if ((window as any).__fraudDetectionCleanup) {
      (window as any).__fraudDetectionCleanup();
    }
  }
}

// Export singleton instance
export const fraudDetection = FraudDetectionEngine.getInstance();
