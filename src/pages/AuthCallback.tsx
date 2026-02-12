/**
 * Auth Callback Page
 * Handles OAuth callback from the oauth-proxy edge function.
 * Verifies the magic link token and establishes a Supabase session.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMessage(searchParams.get('error_description') || error);
          return;
        }

        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to') || '/dashboard';

        if (token && type) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as 'magiclink',
          });

          if (verifyError) {
            setStatus('error');
            setErrorMessage(verifyError.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            setTimeout(() => navigate(redirectTo, { replace: true }), 800);
            return;
          }
        }

        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
          if (data.session) {
            setStatus('success');
            setTimeout(() => navigate('/dashboard', { replace: true }), 800);
            return;
          }
        }

        navigate('/auth', { replace: true });
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 focus:outline-none">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-orange-100/50 dark:border-zinc-800/50 shadow-xl p-8 text-center">
          {status === 'processing' && (
            <div className="space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 animate-pulse opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Completing sign in...
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Please wait while we verify your identity.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Welcome back!
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Sign in successful. Redirecting you now...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Authentication Failed
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {errorMessage || 'Something went wrong during sign in.'}
                </p>
              </div>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
