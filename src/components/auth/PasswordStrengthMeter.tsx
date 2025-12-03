/**
 * Password Strength Meter Component
 * Visual indicator for password strength with real-time feedback
 */

import { useMemo } from 'react';
import { calculatePasswordStrength, type PasswordStrength } from '@/lib/validation';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bgColor: string }> = {
  'weak': { label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500' },
  'fair': { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-500' },
  'good': { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
  'strong': { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' },
  'very-strong': { label: 'Very Strong', color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
};

export function PasswordStrengthMeter({
  password,
  className,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const strengthResult = useMemo(() => {
    if (!password) return null;
    return calculatePasswordStrength(password);
  }, [password]);

  if (!password || !strengthResult) {
    return null;
  }

  const config = strengthConfig[strengthResult.strength];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300 rounded-full', config.bgColor)}
            style={{ width: `${strengthResult.score}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5 pt-1">
          <RequirementItem
            met={strengthResult.requirements.length}
            text="At least 8 characters"
          />
          <RequirementItem
            met={strengthResult.requirements.uppercase}
            text="One uppercase letter"
          />
          <RequirementItem
            met={strengthResult.requirements.lowercase}
            text="One lowercase letter"
          />
          <RequirementItem
            met={strengthResult.requirements.number}
            text="One number"
          />
          <RequirementItem
            met={strengthResult.requirements.special}
            text="One special character"
          />
          {!strengthResult.requirements.notCommon && (
            <RequirementItem
              met={false}
              text="Not a common password"
              warning
            />
          )}
        </div>
      )}

      {/* Additional Feedback */}
      {strengthResult.feedback.length > 0 && strengthResult.score < 70 && (
        <div className="text-xs text-muted-foreground pt-1">
          <span className="font-medium">Tip:</span> {strengthResult.feedback[0]}
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
  warning?: boolean;
}

function RequirementItem({ met, text, warning }: RequirementItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <X className={cn('h-3.5 w-3.5', warning ? 'text-orange-500' : 'text-muted-foreground')} />
      )}
      <span className={cn(
        met ? 'text-green-600' : warning ? 'text-orange-500' : 'text-muted-foreground'
      )}>
        {text}
      </span>
    </div>
  );
}
