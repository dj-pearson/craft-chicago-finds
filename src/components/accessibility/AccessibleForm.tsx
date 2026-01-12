/**
 * Accessible Form Components
 * Provides WCAG 2.1 AA compliant form patterns
 */

import { ReactNode, useId, forwardRef, createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { LiveRegion } from './LiveRegion';

// Form Context for managing accessibility state
interface FormContextValue {
  formId: string;
  errors: Record<string, string>;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  announceError: (message: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within an AccessibleForm');
  }
  return context;
}

// Accessible Form Wrapper
interface AccessibleFormProps {
  children: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AccessibleForm({
  children,
  onSubmit,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: AccessibleFormProps) {
  const formId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Announce form submission to screen readers
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      setAnnouncement(`Form has ${errorCount} error${errorCount === 1 ? '' : 's'}. Please correct before submitting.`);
    }

    onSubmit?.(e);
  };

  const setError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const announceError = (message: string) => {
    setAnnouncement(message);
  };

  return (
    <FormContext.Provider value={{ formId, errors, setError, clearError, announceError }}>
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        noValidate // We handle validation ourselves for better accessibility
      >
        {children}
        {/* Live region for form announcements */}
        <LiveRegion message={announcement} politeness="assertive" />
      </form>
    </FormContext.Provider>
  );
}

// Accessible Form Field
interface AccessibleFieldProps {
  id?: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search' | 'textarea';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
  error?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  rows?: number;
}

export const AccessibleField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  AccessibleFieldProps
>(({
  id: providedId,
  name,
  label,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  description,
  error,
  value,
  onChange,
  onBlur,
  className,
  inputClassName,
  autoComplete,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  rows = 4,
}, ref) => {
  const generatedId = useId();
  const id = providedId || `field-${name}-${generatedId}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  // Combine aria-describedby values
  const ariaDescribedby = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const commonProps = {
    id,
    name,
    required,
    disabled,
    placeholder,
    value,
    onChange,
    onBlur,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': ariaDescribedby,
    'aria-required': required,
    className: cn(
      inputClassName,
      error && 'border-destructive focus-visible:ring-destructive'
    ),
    autoComplete,
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={id}
        className={cn(
          'flex items-center gap-1',
          disabled && 'text-muted-foreground'
        )}
      >
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">*</span>
        )}
        {required && (
          <span className="sr-only">(required)</span>
        )}
      </Label>

      {description && (
        <p
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}

      {type === 'textarea' ? (
        <Textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          {...commonProps}
          rows={rows}
        />
      ) : (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          type={type}
          min={min}
          max={max}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          {...commonProps}
        />
      )}

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

AccessibleField.displayName = 'AccessibleField';

// Accessible Fieldset for grouping related fields
interface AccessibleFieldsetProps {
  legend: string;
  description?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
}

export function AccessibleFieldset({
  legend,
  description,
  children,
  className,
  required = false,
  error,
}: AccessibleFieldsetProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      className={cn('space-y-4', className)}
      aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-sm font-medium flex items-center gap-1">
        {legend}
        {required && (
          <>
            <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>

      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

// Accessible Form Error Summary
interface FormErrorSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-md bg-destructive/10 p-4 border border-destructive/20',
        className
      )}
      role="alert"
      aria-labelledby="error-summary-heading"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" aria-hidden="true" />
        <div>
          <h2
            id="error-summary-heading"
            className="text-sm font-semibold text-destructive"
          >
            {errorEntries.length === 1
              ? 'There is a problem'
              : `There are ${errorEntries.length} problems`}
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-destructive/90">
            {errorEntries.map(([field, message]) => (
              <li key={field}>
                <a
                  href={`#field-${field}`}
                  className="underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(`[name="${field}"]`) as HTMLElement;
                    if (element) {
                      element.focus();
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Accessible Form Success Message
interface FormSuccessMessageProps {
  message: string;
  className?: string;
}

export function FormSuccessMessage({ message, className }: FormSuccessMessageProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-green-50 p-4 border border-green-200',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
        <p className="text-sm text-green-800">{message}</p>
      </div>
    </div>
  );
}

// Hook for managing form field validation with accessibility
export function useAccessibleValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (name: string, value: string, rules: {
    required?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: (value: string) => string | undefined;
  }) => {
    const { required, minLength, maxLength, pattern, custom } = rules;

    if (required && !value.trim()) {
      const message = typeof required === 'string' ? required : 'This field is required';
      setErrors(prev => ({ ...prev, [name]: message }));
      return message;
    }

    if (minLength && value.length < minLength.value) {
      setErrors(prev => ({ ...prev, [name]: minLength.message }));
      return minLength.message;
    }

    if (maxLength && value.length > maxLength.value) {
      setErrors(prev => ({ ...prev, [name]: maxLength.message }));
      return maxLength.message;
    }

    if (pattern && !pattern.value.test(value)) {
      setErrors(prev => ({ ...prev, [name]: pattern.message }));
      return pattern.message;
    }

    if (custom) {
      const customError = custom(value);
      if (customError) {
        setErrors(prev => ({ ...prev, [name]: customError }));
        return customError;
      }
    }

    // Clear error if validation passes
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    return undefined;
  };

  const touch = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const clearAll = () => {
    setErrors({});
    setTouched({});
  };

  return {
    errors,
    touched,
    validate,
    touch,
    clearAll,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (name: string) => touched[name] ? errors[name] : undefined,
  };
}
