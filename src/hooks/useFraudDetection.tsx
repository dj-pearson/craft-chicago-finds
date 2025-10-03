import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { fraudDetection, FraudSignal } from '@/lib/fraud-detection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface FraudDetectionResult {
  riskScore: number;
  signals: FraudSignal[];
  shouldBlock: boolean;
  shouldReview: boolean;
  recommendation: 'approve' | 'review' | 'block';
}

interface UseFraudDetectionOptions {
  enableRealTimeMonitoring?: boolean;
  autoInitialize?: boolean;
}

export const useFraudDetection = (options: UseFraudDetectionOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { enableRealTimeMonitoring = true, autoInitialize = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [recentSignals, setRecentSignals] = useState<FraudSignal[]>([]);

  // Initialize fraud detection when user is available
  useEffect(() => {
    if (autoInitialize && user && !isInitialized) {
      initializeFraudDetection();
    }
  }, [user, autoInitialize, isInitialized]);

  // Load user trust score
  useEffect(() => {
    if (user) {
      loadUserTrustScore();
    }
  }, [user]);

  // Load recent fraud signals
  useEffect(() => {
    if (user && enableRealTimeMonitoring) {
      loadRecentSignals();
    }
  }, [user, enableRealTimeMonitoring]);

  /**
   * Initialize fraud detection system
   */
  const initializeFraudDetection = useCallback(async () => {
    try {
      await fraudDetection.initializeSession(user?.id);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize fraud detection:', error);
      toast({
        title: 'Security System Error',
        description: 'Unable to initialize security monitoring. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [user?.id, toast]);

  /**
   * Load user's current trust score
   */
  const loadUserTrustScore = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_trust_scores')
        .select('trust_score, verification_level, last_calculated')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setTrustScore(data.trust_score);
      } else {
        // Create initial trust score record
        const { data: newScore } = await supabase
          .from('user_trust_scores')
          .insert({ user_id: user.id })
          .select('trust_score')
          .single();

        if (newScore) {
          setTrustScore(newScore.trust_score);
        }
      }
    } catch (error) {
      console.error('Failed to load trust score:', error);
    }
  }, [user]);

  /**
   * Load recent fraud signals for the user
   */
  const loadRecentSignals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fraud_signals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const signals: FraudSignal[] = data.map(signal => ({
          id: signal.id,
          type: signal.signal_type as any,
          severity: signal.severity as any,
          description: signal.description,
          confidence: signal.confidence,
          metadata: signal.metadata || {},
          timestamp: signal.created_at,
          actionRequired: signal.action_required
        }));

        setRecentSignals(signals);
      }
    } catch (error) {
      console.error('Failed to load recent signals:', error);
    }
  }, [user]);

  /**
   * Analyze a transaction for fraud
   */
  const analyzeTransaction = useCallback(async (transactionData: {
    amount: number;
    listingId: string;
    sellerId: string;
    paymentMethodId?: string;
    shippingAddress?: any;
  }): Promise<FraudDetectionResult> => {
    if (!user) {
      throw new Error('User must be authenticated for fraud analysis');
    }

    setIsAnalyzing(true);

    try {
      // Run fraud detection analysis
      const signals = await fraudDetection.analyzeTransaction({
        ...transactionData,
        userId: user.id
      });

      // Calculate risk score
      const riskScore = fraudDetection.calculateRiskScore(signals);

      // Determine recommendation based on risk score and signals
      let recommendation: 'approve' | 'review' | 'block' = 'approve';
      let shouldBlock = false;
      let shouldReview = false;

      // Check for critical signals
      const criticalSignals = signals.filter(s => s.severity === 'critical');
      const highSignals = signals.filter(s => s.severity === 'high');

      if (criticalSignals.length > 0 || riskScore >= 80) {
        recommendation = 'block';
        shouldBlock = true;
      } else if (highSignals.length > 0 || riskScore >= 60) {
        recommendation = 'review';
        shouldReview = true;
      }

      // Additional checks based on trust score
      if (trustScore !== null) {
        if (trustScore < 30 && transactionData.amount > 200) {
          recommendation = 'review';
          shouldReview = true;
        } else if (trustScore < 10) {
          recommendation = 'block';
          shouldBlock = true;
        }
      }

      // Check database rules for additional validation
      const { data: shouldFlag } = await supabase
        .rpc('should_flag_transaction', {
          target_user_id: user.id,
          transaction_amount: transactionData.amount,
          seller_id: transactionData.sellerId
        });

      if (shouldFlag && recommendation === 'approve') {
        recommendation = 'review';
        shouldReview = true;
      }

      return {
        riskScore,
        signals,
        shouldBlock,
        shouldReview,
        recommendation
      };

    } catch (error) {
      console.error('Fraud analysis failed:', error);
      
      // Return safe defaults on error
      return {
        riskScore: 50,
        signals: [],
        shouldBlock: false,
        shouldReview: true, // Err on the side of caution
        recommendation: 'review'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, trustScore]);

  /**
   * Report a false positive (admin function)
   */
  const reportFalsePositive = useCallback(async (signalId: string) => {
    try {
      const { error } = await supabase
        .from('fraud_signals')
        .update({ false_positive: true, updated_at: new Date().toISOString() })
        .eq('id', signalId);

      if (error) throw error;

      // Reload recent signals
      await loadRecentSignals();

      toast({
        title: 'Feedback Recorded',
        description: 'Thank you for helping improve our fraud detection system.',
      });
    } catch (error) {
      console.error('Failed to report false positive:', error);
      toast({
        title: 'Error',
        description: 'Failed to record feedback. Please try again.',
        variant: 'destructive'
      });
    }
  }, [loadRecentSignals, toast]);

  /**
   * Get fraud detection status for display
   */
  const getSecurityStatus = useCallback(() => {
    if (!trustScore) return { level: 'unknown', color: 'gray', message: 'Calculating...' };

    if (trustScore >= 80) {
      return { 
        level: 'high', 
        color: 'green', 
        message: 'High Trust - Enhanced Security Active' 
      };
    } else if (trustScore >= 60) {
      return { 
        level: 'medium', 
        color: 'yellow', 
        message: 'Medium Trust - Standard Security Active' 
      };
    } else if (trustScore >= 30) {
      return { 
        level: 'low', 
        color: 'orange', 
        message: 'Building Trust - Additional Verification May Be Required' 
      };
    } else {
      return { 
        level: 'very-low', 
        color: 'red', 
        message: 'New Account - Enhanced Verification Required' 
      };
    }
  }, [trustScore]);

  /**
   * Cleanup fraud detection resources
   */
  const cleanup = useCallback(() => {
    fraudDetection.cleanup();
    setIsInitialized(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    isInitialized,
    isAnalyzing,
    trustScore,
    recentSignals,

    // Actions
    initializeFraudDetection,
    analyzeTransaction,
    reportFalsePositive,
    cleanup,

    // Utilities
    getSecurityStatus,
    loadUserTrustScore,
    loadRecentSignals
  };
};
