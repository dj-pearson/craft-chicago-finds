/**
 * Password Reset Page
 * Handles password update after user clicks reset link in email
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { validators } from '@/lib/validation';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

// Use the same strong password policy as signup
const passwordSchema = validators.password;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if user is authenticated (from email link)
  useEffect(() => {
    if (!user) {
      toast.error('Invalid or expired reset link');
      setTimeout(() => navigate('/auth'), 2000);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(newPassword);

    if (error) {
      toast.error(error.message || 'Failed to update password');
      setLoading(false);
    } else {
      toast.success('Password updated successfully!');
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (!user) {
    return (
      <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center focus:outline-none">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (success) {
    return (
      <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted focus:outline-none">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Password Updated!</h2>
                <p className="text-muted-foreground mt-2">
                  Your password has been successfully updated. Redirecting...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main id="main-content" role="main" tabIndex={-1} className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted focus:outline-none">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
          <p className="text-muted-foreground">Enter your new password below</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Password</CardTitle>
            <CardDescription>
              Choose a strong password with at least 8 characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
