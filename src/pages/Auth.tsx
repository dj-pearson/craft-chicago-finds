/**
 * Authentication Page
 * Handles sign up, sign in, OAuth (Google/Apple via proxy), MFA, and password reset.
 * Features a modern split-layout design with craft-themed visuals.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { useAccountLockout } from '@/hooks/useAccountLockout';
import { useMFA } from '@/hooks/useMFA';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { MFAVerification } from '@/components/auth/MFAVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Scissors,
  Palette,
  Gem,
  ShoppingBag,
  Star,
  Heart,
  Sparkles,
  Shield,
} from 'lucide-react';
import { validators, sanitizeRedirectURL } from '@/lib/validation';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { cn } from '@/lib/utils';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = validators.password;
const displayNameSchema = z.string().min(2, 'Display name must be at least 2 characters').optional();

// Floating craft badge component for the showcase panel
function FloatingBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute flex items-center gap-2 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-3 py-1.5 shadow-lg border border-orange-100/50 dark:border-zinc-700/50',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
  );
}

// Google icon SVG as a component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
  );
}

// Apple icon SVG as a component
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

type AuthView = 'signin' | 'signup' | 'reset' | 'reset-sent';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signOut, resetPassword, loading: authLoading } = useAuth();
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  const { checkLockout, recordLoginAttempt, getTimeUntilUnlock } = useAccountLockout();
  const {
    isMFAEnabled,
    verifyCode,
    verifyBackupCode,
    isCurrentDeviceTrusted,
    trustDevice,
    isLoading: mfaLoading,
  } = useMFA();

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AuthView>('signin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaAttemptsRemaining, setMfaAttemptsRemaining] = useState(5);

  // Account lockout state
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    lockedUntil: Date | null;
    remainingAttempts: number;
  } | null>(null);

  // Redirect handling
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = sanitizeRedirectURL(rawRedirect);

  // Check for OAuth error in URL params
  const oauthError = searchParams.get('error');
  const oauthErrorDesc = searchParams.get('error_description');

  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Reset form
  const [resetEmail, setResetEmail] = useState('');

  // Show OAuth error toast if present
  useEffect(() => {
    if (oauthError) {
      toast.error(oauthErrorDesc || `OAuth error: ${oauthError}`);
    }
  }, [oauthError, oauthErrorDesc]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !showMFAVerification) {
      if (isMFAEnabled && !isCurrentDeviceTrusted()) {
        setShowMFAVerification(true);
      } else {
        navigate(redirectTo);
      }
    }
  }, [user, navigate, redirectTo, isMFAEnabled, isCurrentDeviceTrusted, showMFAVerification]);

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

    const lockoutCheck = await checkLockout(signInEmail);
    if (lockoutCheck.isLocked) {
      const timeRemaining = getTimeUntilUnlock(lockoutCheck.lockedUntil);
      toast.error(`Account is temporarily locked. Please try again in ${timeRemaining}.`);
      setLockoutInfo({ isLocked: true, lockedUntil: lockoutCheck.lockedUntil, remainingAttempts: 0 });
      return;
    }

    const { allowed, retryAfter } = checkRateLimit();
    if (!allowed) {
      toast.error(`Too many login attempts. Please try again in ${Math.ceil((retryAfter || 0) / 60)} minutes.`);
      return;
    }

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
    recordAttempt(!error);

    const lockoutResult = await recordLoginAttempt(signInEmail, !error, error?.message);

    if (error) {
      setLockoutInfo({
        isLocked: lockoutResult.isLocked,
        lockedUntil: lockoutResult.lockedUntil,
        remainingAttempts: lockoutResult.remainingAttempts,
      });

      if (lockoutResult.isLocked) {
        const timeRemaining = getTimeUntilUnlock(lockoutResult.lockedUntil);
        toast.error(`Account locked due to too many failed attempts. Please try again in ${timeRemaining}.`);
      } else if (error.message.includes('Invalid login credentials')) {
        const attemptsWarning =
          lockoutResult.remainingAttempts <= 2 ? ` (${lockoutResult.remainingAttempts} attempts remaining)` : '';
        toast.error(`Invalid email or password${attemptsWarning}`);
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
      setLoading(false);
    } else {
      setLockoutInfo(null);
      setLoading(false);
    }
  };

  const handleMFAVerify = useCallback(
    async (code: string, method: 'totp' | 'backup'): Promise<boolean> => {
      setMfaVerifying(true);
      setMfaError(null);

      try {
        const isValid = method === 'totp' ? await verifyCode(code) : await verifyBackupCode(code);

        if (isValid) {
          toast.success('Verification successful!');
          setShowMFAVerification(false);
          navigate(redirectTo);
          return true;
        } else {
          const remaining = mfaAttemptsRemaining - 1;
          setMfaAttemptsRemaining(remaining);

          if (remaining <= 0) {
            toast.error('Too many failed verification attempts. Please sign in again.');
            await signOut();
            setShowMFAVerification(false);
            setMfaAttemptsRemaining(5);
          } else {
            setMfaError(`Invalid code. ${remaining} attempts remaining.`);
          }
          return false;
        }
      } catch {
        setMfaError('Verification failed. Please try again.');
        return false;
      } finally {
        setMfaVerifying(false);
      }
    },
    [verifyCode, verifyBackupCode, mfaAttemptsRemaining, signOut, navigate, redirectTo]
  );

  const handleTrustDevice = useCallback(
    async (trust: boolean) => {
      if (trust) {
        try {
          await trustDevice();
        } catch (error) {
          console.error('Failed to trust device:', error);
        }
      }
    },
    [trustDevice]
  );

  const handleMFACancel = useCallback(async () => {
    await signOut();
    setShowMFAVerification(false);
    setMfaAttemptsRemaining(5);
    setMfaError(null);
    toast.info('Sign in cancelled');
  }, [signOut]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const { error } = await signUp(signUpEmail, signUpPassword, displayName ? { displayName } : undefined);

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
      setShowOnboarding(true);
    }

    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

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
      setView('reset-sent');
    }

    setLoading(false);
  };

  /**
   * OAuth sign-in via the edge function proxy.
   * Redirects the user to the oauth-proxy edge function which handles
   * the full OAuth flow and redirects back to /auth/callback.
   */
  const handleOAuthSignIn = (provider: 'google' | 'apple') => {
    setLoading(true);
    const functionsUrl = import.meta.env.VITE_FUNCTIONS_URL;

    if (!functionsUrl) {
      toast.error('OAuth is not configured. Please set VITE_FUNCTIONS_URL.');
      setLoading(false);
      return;
    }

    const oauthUrl = `${functionsUrl}/oauth-proxy?action=authorize&provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.href = oauthUrl;
  };

  // Loading state
  if (authLoading || (user && mfaLoading)) {
    return (
      <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 focus:outline-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </main>
    );
  }

  // MFA verification screen
  if (showMFAVerification && user) {
    return (
      <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 focus:outline-none">
        <MFAVerification
          onVerify={handleMFAVerify}
          onTrustDevice={handleTrustDevice}
          onCancel={handleMFACancel}
          email={user.email}
          isLoading={mfaVerifying}
          error={mfaError}
          attemptsRemaining={mfaAttemptsRemaining}
        />
      </main>
    );
  }

  // Divider component
  const Divider = ({ bgClass }: { bgClass: string }) => (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className={cn('px-3 text-zinc-400 dark:text-zinc-500', bgClass)}>or</span>
      </div>
    </div>
  );

  // OAuth buttons component (shared between sign in and sign up)
  const OAuthButtons = () => (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading}
        className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-medium transition-all hover:shadow-md"
      >
        <GoogleIcon className="mr-2.5 h-4.5 w-4.5" />
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleOAuthSignIn('apple')}
        disabled={loading}
        className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-medium transition-all hover:shadow-md"
      >
        <AppleIcon className="mr-2.5 h-4.5 w-4.5" />
        Continue with Apple
      </Button>
    </div>
  );

  return (
    <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 focus:outline-none">
      {/* Left showcase panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500 dark:from-orange-900 dark:via-amber-800 dark:to-yellow-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-800/20 via-transparent to-transparent" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top: Logo */}
          <div>
            <a href="/" className="inline-flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">CraftLocal</span>
            </a>
          </div>

          {/* Center: Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Where Chicago's
                <br />
                artisans shine.
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Join a thriving community of local makers and discover one-of-a-kind handcrafted goods from your
                neighborhood.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold text-white">2,500+</div>
                <div className="text-sm text-white/60">Unique items</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">400+</div>
                <div className="text-sm text-white/60">Local artisans</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-sm text-white/60">Neighborhoods</div>
              </div>
            </div>
          </div>

          {/* Bottom: Testimonial */}
          <div className="max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                ))}
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                "CraftLocal completely changed how I sell my ceramics. The local pickup feature means I save on shipping
                and my customers love meeting me at the studio."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white">
                  MR
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Maria R.</div>
                  <div className="text-xs text-white/50">Ceramics artist, Pilsen</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <FloatingBadge icon={Scissors} label="Handcrafted" className="top-[20%] right-12 animate-[float_6s_ease-in-out_infinite]" />
        <FloatingBadge icon={Palette} label="Locally made" className="top-[40%] right-8 animate-[float_6s_ease-in-out_infinite_1s]" />
        <FloatingBadge icon={Gem} label="One-of-a-kind" className="top-[60%] right-16 animate-[float_6s_ease-in-out_infinite_2s]" />
        <FloatingBadge icon={Heart} label="Community first" className="bottom-[25%] right-10 animate-[float_6s_ease-in-out_infinite_3s]" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <a href="/" className="inline-flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-600 to-amber-500 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">CraftLocal</span>
            </a>
          </div>

          {/* ===== SIGN IN VIEW ===== */}
          {view === 'signin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Welcome back</h2>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Sign in to your account to continue
                </p>
              </div>

              {/* OAuth buttons first for emphasis */}
              <OAuthButtons />

              <Divider bgClass="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

              {/* Lockout warnings */}
              {lockoutInfo?.isLocked && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Account temporarily locked.
                    {lockoutInfo.lockedUntil && (
                      <span className="block mt-1">Try again in {getTimeUntilUnlock(lockoutInfo.lockedUntil)}.</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!lockoutInfo?.isLocked &&
                lockoutInfo?.remainingAttempts !== undefined &&
                lockoutInfo.remainingAttempts <= 2 &&
                lockoutInfo.remainingAttempts > 0 && (
                  <Alert className="rounded-xl border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                      {lockoutInfo.remainingAttempts} attempt{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} remaining
                      before lockout.
                    </AlertDescription>
                  </Alert>
                )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('reset');
                        setResetEmail(signInEmail);
                      }}
                      className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pr-10 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                  disabled={loading || lockoutInfo?.isLocked}
                >
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

              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('signup')}
                  className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  Create one
                </button>
              </p>
            </div>
          )}

          {/* ===== SIGN UP VIEW ===== */}
          {view === 'signup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create your account</h2>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Join Chicago's handmade marketplace
                </p>
              </div>

              <OAuthButtons />

              <Divider bgClass="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Display Name{' '}
                    <span className="text-zinc-400 dark:text-zinc-500 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pr-10 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={signUpPassword} />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                  disabled={loading}
                >
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

              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* ===== PASSWORD RESET VIEW ===== */}
          {view === 'reset' && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reset your password</h2>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* ===== RESET SENT VIEW ===== */}
          {view === 'reset-sent' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Check your email</h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  We've sent a password reset link to{' '}
                  <strong className="text-zinc-700 dark:text-zinc-300">{resetEmail}</strong>.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setView('signin');
                  setResetEmail('');
                }}
                className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-700"
              >
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
              <Shield className="h-3.5 w-3.5" />
              <span>256-bit encryption</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Purchase protection</span>
            </div>
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              By continuing, you agree to our{' '}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 underline underline-offset-2 transition-colors"
              >
                Terms
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard open={showOnboarding} onComplete={() => setShowOnboarding(false)} />

      {/* Float animation keyframes via style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </main>
  );
}
