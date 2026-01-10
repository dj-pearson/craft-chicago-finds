/**
 * Biometric Login Button Component
 * Allows users to authenticate using biometrics on the login page
 */

import { useState } from 'react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BiometricLoginButtonProps {
  onSuccess: (userId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function BiometricLoginButton({
  onSuccess,
  onError,
  className,
  variant = 'outline',
  size = 'default',
}: BiometricLoginButtonProps) {
  const { isSupported, isPlatformAuthenticatorAvailable, authenticateForLogin } = useBiometricAuth();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Don't render if biometrics aren't available
  if (!isSupported || !isPlatformAuthenticatorAvailable) {
    return null;
  }

  const handleClick = async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateForLogin();

      if (result.success && result.userId) {
        toast({
          title: 'Authenticated',
          description: 'Biometric authentication successful',
        });
        onSuccess(result.userId);
      } else {
        const errorMessage = result.error || 'Authentication failed';
        toast({
          title: 'Authentication Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        onError?.(errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      toast({
        title: 'Authentication Failed',
        description: message,
        variant: 'destructive',
      });
      onError?.(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isAuthenticating}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Authenticating...
        </>
      ) : (
        <>
          <Fingerprint className="h-4 w-4 mr-2" />
          Sign in with Biometrics
        </>
      )}
    </Button>
  );
}

export default BiometricLoginButton;
