/**
 * Authentication Page
 * Handles both sign up and sign in flows
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { useAccountLockout } from '@/hooks/useAccountLockout';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import { validators } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = validators.password; // Use strong password policy (8+ chars with complexity)
const displayNameSchema = z.string().min(2, 'Display name must be at least 2 characters').optional();

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, resetPassword, loading: authLoading } = useAuth();
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  const { checkLockout, recordLoginAttempt, getTimeUntilUnlock, formatLockReason } = useAccountLockout();
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Account lockout state
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    lockedUntil: Date | null;
    remainingAttempts: number;
  } | null>(null);

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/';

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  // Check lockout status when email changes
  useEffect(() => {
    const checkEmailLockout = async () => {
      if (signInEmail && signInEmail.includes('@')) {
        const result = await checkLockout(signInEmail);
        setLockoutInfo({
          isLocked: result.isLocked,
          lockedUntil: result.lockedUntil,
          remainingAttempts: result.remainingAttempts,
        });
      } else {
        setLockoutInfo(null);
      }
    };

    const debounce = setTimeout(checkEmailLockout, 500);
    return () => clearTimeout(debounce);
  }, [signInEmail, checkLockout]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check server-side lockout first
    const lockoutCheck = await checkLockout(signInEmail);
    if (lockoutCheck.isLocked) {
      const timeRemaining = getTimeUntilUnlock(lockoutCheck.lockedUntil);
      toast.error(
        `Account is temporarily locked. Please try again in ${timeRemaining}.`
      );
      setLockoutInfo({
        isLocked: true,
        lockedUntil: lockoutCheck.lockedUntil,
        remainingAttempts: 0,
      });
      return;
    }

    // Also check client-side rate limit as a backup
    const { allowed, retryAfter } = checkRateLimit();
    if (!allowed) {
      toast.error(
        `Too many login attempts. Please try again in ${Math.ceil((retryAfter || 0) / 60)} minutes.`
      );
      return;
    }

    // Validate inputs
    try {
      emailSchema.parse(signInEmail);
      passwordSchema.parse(signInPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error } = await signIn(signInEmail, signInPassword);

    // Record attempt for both client and server-side tracking
    recordAttempt(!error);

    // Record server-side login attempt and get updated lockout status
    const lockoutResult = await recordLoginAttempt(
      signInEmail,
      !error,
      error?.message
    );

    if (error) {
      // Update lockout info
      setLockoutInfo({
        isLocked: lockoutResult.isLocked,
        lockedUntil: lockoutResult.lockedUntil,
        remainingAttempts: lockoutResult.remainingAttempts,
      });

      if (lockoutResult.isLocked) {
        const timeRemaining = getTimeUntilUnlock(lockoutResult.lockedUntil);
        toast.error(
          `Account locked due to too many failed attempts. Please try again in ${timeRemaining}.`
        );
      } else if (error.message.includes('Invalid login credentials')) {
        const attemptsWarning = lockoutResult.remainingAttempts <= 2
          ? ` (${lockoutResult.remainingAttempts} attempts remaining)`
          : '';
        toast.error(`Invalid email or password${attemptsWarning}`);
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } else {
      setLockoutInfo(null);
      toast.success('Welcome back!');
      navigate(redirectTo);
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      emailSchema.parse(signUpEmail);
      passwordSchema.parse(signUpPassword);
      if (displayName) {
        displayNameSchema.parse(displayName);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error } = await signUp(signUpEmail, signUpPassword, displayName || undefined);

    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else if (error.message.includes('Password should be')) {
        toast.error('Password must be at least 6 characters');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } else {
      toast.success('Account created! Please check your email to confirm.');
      // Show onboarding wizard for new users
      setShowOnboarding(true);
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast.error(error.message || 'Failed to send reset email');
    } else {
      toast.success('Password reset link sent! Check your email.');
      setResetSent(true);
    }

    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });

    if (error) {
      toast.error(`Failed to sign in with ${provider}: ${error.message}`);
      setLoading(false);
    }
    // Don't set loading to false on success - user will be redirected
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">CraftLocal</h1>
          <p className="text-muted-foreground">Discover unique handmade items from local artisans</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
              {/* Account Lockout Warning */}
              {lockoutInfo?.isLocked && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This account is temporarily locked due to too many failed login attempts.
                    {lockoutInfo.lockedUntil && (
                      <span className="block mt-1">
                        Try again in {getTimeUntilUnlock(lockoutInfo.lockedUntil)}.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Low Attempts Warning */}
              {!lockoutInfo?.isLocked && lockoutInfo?.remainingAttempts !== undefined && lockoutInfo.remainingAttempts <= 2 && lockoutInfo.remainingAttempts > 0 && (
                <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    Warning: {lockoutInfo.remainingAttempts} login attempt{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.
                  </AlertDescription>
                </Alert>
              )}

              {!showPasswordReset ? (
                <>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordReset(true);
                            setResetEmail(signInEmail);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || lockoutInfo?.isLocked}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : lockoutInfo?.isLocked ? (
                        'Account Locked'
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthSignIn('apple')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {!resetSent ? (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Reset Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send Reset Link'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowPasswordReset(false);
                            setResetSent(false);
                          }}
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-green-600">Check Your Email</h3>
                        <p className="text-sm text-muted-foreground">
                          We've sent a password reset link to <strong>{resetEmail}</strong>.
                          Click the link in the email to reset your password.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setResetSent(false);
                          setResetEmail('');
                        }}
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="bg-card p-6 rounded-lg border border-border shadow-lg">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name (Optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and a number
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Terms of Service
          </a>
          {' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
