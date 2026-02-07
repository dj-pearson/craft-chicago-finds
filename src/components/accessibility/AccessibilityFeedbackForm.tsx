/**
 * Accessibility Feedback Form
 * Allows users to report accessibility issues
 * WCAG 3.3.2 - Labels or Instructions
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Loader2, MessageSquare, Send } from 'lucide-react';
import { LiveRegion } from './LiveRegion';

// Form validation schema
const feedbackSchema = z.object({
  issueType: z.enum([
    'navigation',
    'screen_reader',
    'keyboard',
    'visual',
    'content',
    'form',
    'media',
    'other',
  ]),
  pageUrl: z.string().min(1, 'Page URL is required'),
  issueDescription: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
  expectedBehavior: z.string().optional(),
  assistiveTechnology: z.string().optional(),
  browser: z.string().optional(),
  reporterEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  reporterName: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const issueTypes = [
  { value: 'navigation', label: 'Navigation', description: 'Issues with moving around the site' },
  { value: 'screen_reader', label: 'Screen Reader', description: 'Problems with screen reader compatibility' },
  { value: 'keyboard', label: 'Keyboard', description: 'Issues using keyboard navigation' },
  { value: 'visual', label: 'Visual', description: 'Color contrast, text size, or display issues' },
  { value: 'content', label: 'Content', description: 'Missing alt text, unclear content' },
  { value: 'form', label: 'Forms', description: 'Issues with form fields or validation' },
  { value: 'media', label: 'Media', description: 'Problems with images, videos, or audio' },
  { value: 'other', label: 'Other', description: 'Any other accessibility issue' },
];

interface AccessibilityFeedbackFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function AccessibilityFeedbackForm({ className, onSuccess }: AccessibilityFeedbackFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
  });

  const selectedIssueType = watch('issueType');

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    setAnnouncement('Submitting your feedback...');

    try {
      // Get device type
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent)
        ? 'mobile'
        : /Tablet|iPad/i.test(navigator.userAgent)
        ? 'tablet'
        : 'desktop';

      // Submit to database
      const { error } = await supabase.from('accessibility_feedback').insert({
        user_id: user?.id || null,
        reporter_email: data.reporterEmail || null,
        reporter_name: data.reporterName || null,
        page_url: data.pageUrl,
        issue_type: data.issueType,
        issue_description: data.issueDescription,
        expected_behavior: data.expectedBehavior || null,
        browser: data.browser || null,
        assistive_technology: data.assistiveTechnology || null,
        device_type: deviceType,
      });

      if (error) throw error;

      setIsSubmitted(true);
      setAnnouncement('Thank you! Your feedback has been submitted successfully.');
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for helping us improve accessibility. We will review your feedback.',
      });
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setAnnouncement('There was an error submitting your feedback. Please try again.');
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-4">
              Your accessibility feedback has been submitted. We appreciate your help in making our
              platform accessible to everyone.
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Submit Another Report
            </Button>
          </div>
          <LiveRegion message={announcement} politeness="polite" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Report an Accessibility Issue
        </CardTitle>
        <CardDescription>
          Help us improve accessibility by reporting any issues you encounter. Your feedback is valuable
          and helps us make our platform usable for everyone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Issue Type */}
          <div className="space-y-3">
            <Label htmlFor="issueType" className="text-base font-medium">
              What type of issue are you experiencing?
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <RadioGroup
              onValueChange={(value) => setValue('issueType', value as any)}
              className="grid grid-cols-2 md:grid-cols-4 gap-2"
              aria-required="true"
            >
              {issueTypes.map((type) => (
                <div key={type.value}>
                  <RadioGroupItem
                    value={type.value}
                    id={`issue-${type.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`issue-${type.value}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                  >
                    <span className="text-sm font-medium">{type.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.issueType && (
              <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Please select an issue type
              </p>
            )}
          </div>

          {/* Page URL */}
          <div className="space-y-2">
            <Label htmlFor="pageUrl">
              Page URL
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <Input
              id="pageUrl"
              {...register('pageUrl')}
              aria-invalid={errors.pageUrl ? 'true' : undefined}
              aria-describedby={errors.pageUrl ? 'pageUrl-error' : undefined}
            />
            {errors.pageUrl && (
              <p id="pageUrl-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errors.pageUrl.message}
              </p>
            )}
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issueDescription">
              Describe the issue
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </Label>
            <p id="issueDescription-hint" className="text-sm text-muted-foreground">
              Please describe the accessibility barrier you encountered in detail.
            </p>
            <Textarea
              id="issueDescription"
              {...register('issueDescription')}
              rows={4}
              aria-invalid={errors.issueDescription ? 'true' : undefined}
              aria-describedby="issueDescription-hint issueDescription-error"
            />
            {errors.issueDescription && (
              <p id="issueDescription-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {errors.issueDescription.message}
              </p>
            )}
          </div>

          {/* Expected Behavior */}
          <div className="space-y-2">
            <Label htmlFor="expectedBehavior">What did you expect to happen? (optional)</Label>
            <Textarea
              id="expectedBehavior"
              {...register('expectedBehavior')}
              rows={2}
            />
          </div>

          {/* Assistive Technology */}
          <div className="space-y-2">
            <Label htmlFor="assistiveTechnology">
              Assistive technology used (optional)
            </Label>
            <p id="assistiveTechnology-hint" className="text-sm text-muted-foreground">
              e.g., NVDA, JAWS, VoiceOver, Dragon NaturallySpeaking
            </p>
            <Input
              id="assistiveTechnology"
              {...register('assistiveTechnology')}
              placeholder="e.g., NVDA, VoiceOver"
              aria-describedby="assistiveTechnology-hint"
            />
          </div>

          {/* Contact Info (for non-logged-in users) */}
          {!user && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Optionally provide your contact information so we can follow up with you about this issue.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reporterName">Your name (optional)</Label>
                  <Input
                    id="reporterName"
                    {...register('reporterName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporterEmail">Your email (optional)</Label>
                  <Input
                    id="reporterEmail"
                    type="email"
                    {...register('reporterEmail')}
                    aria-invalid={errors.reporterEmail ? 'true' : undefined}
                    aria-describedby={errors.reporterEmail ? 'reporterEmail-error' : undefined}
                  />
                  {errors.reporterEmail && (
                    <p id="reporterEmail-error" className="text-sm text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      {errors.reporterEmail.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Submit Feedback
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We review all accessibility feedback and aim to address issues promptly.
          </p>
        </form>
        <LiveRegion message={announcement} politeness="polite" />
      </CardContent>
    </Card>
  );
}

// Dialog wrapper for the form
export function AccessibilityFeedbackDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
          Report Accessibility Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report an Accessibility Issue</DialogTitle>
          <DialogDescription>
            Help us improve accessibility for all users by reporting any issues you encounter.
          </DialogDescription>
        </DialogHeader>
        <AccessibilityFeedbackForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
