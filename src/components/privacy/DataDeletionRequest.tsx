/**
 * Data Deletion Request Component
 * GDPR Article 17 - Right to erasure (right to be forgotten)
 */

import { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Clock, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeletionRequest {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
}

export function DataDeletionRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmations, setConfirmations] = useState({
    understand: false,
    irreversible: false,
    legalRetention: false,
  });

  // Fetch existing requests
  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_subject_requests')
        .select('id, request_type, status, created_at, completed_at, notes')
        .eq('user_id', user.id)
        .eq('request_type', 'deletion')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmitRequest = () => {
    return confirmations.understand &&
           confirmations.irreversible &&
           confirmations.legalRetention;
  };

  const submitDeletionRequest = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to request data deletion.',
        variant: 'destructive',
      });
      return;
    }

    if (!canSubmitRequest()) {
      toast({
        title: 'Please Confirm',
        description: 'You must acknowledge all conditions before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if there's already a pending request
      const pendingRequest = requests.find(r =>
        r.status === 'pending' || r.status === 'in_progress'
      );

      if (pendingRequest) {
        toast({
          title: 'Request Already Pending',
          description: 'You already have a pending deletion request.',
          variant: 'destructive',
        });
        setShowConfirmDialog(false);
        return;
      }

      const { error } = await supabase
        .from('data_subject_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          request_type: 'deletion',
          status: 'pending',
          regulation: 'GDPR',
          request_details: {
            reason: reason || 'User requested account deletion',
            confirmations: confirmations,
            requested_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
          },
          notes: reason || null,
        });

      if (error) throw error;

      toast({
        title: 'Deletion Request Submitted',
        description: 'Your data deletion request has been submitted. We will process it within 30 days.',
      });

      setShowConfirmDialog(false);
      setReason('');
      setConfirmations({ understand: false, irreversible: false, legalRetention: false });

      // Refresh the list
      await fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to request deletion of your data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const hasPendingRequest = requests.some(r => r.status === 'pending' || r.status === 'in_progress');

  return (
    <div className="space-y-4">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
            Delete Your Data
          </CardTitle>
          <CardDescription>
            Request deletion of all your personal data. Under GDPR Article 17, you have the right
            to have your personal data erased.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action is irreversible. Once your data is deleted,
              it cannot be recovered. Your account will be permanently closed.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">What will be deleted:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your account and profile information</li>
              <li>Order history and transaction records</li>
              <li>Messages and communications</li>
              <li>Saved favorites and preferences</li>
              <li>Reviews you've written</li>
              <li>All seller data and listings (if applicable)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">What may be retained:</h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Transaction records (7 years for tax compliance)</li>
              <li>Fraud prevention data (as permitted by law)</li>
              <li>Data required for legal claims</li>
              <li>Anonymized/aggregated analytics data</li>
            </ul>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowConfirmDialog(true)}
            disabled={hasPendingRequest}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {hasPendingRequest ? 'Deletion Request Pending' : 'Request Data Deletion'}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deletion Request History</CardTitle>
            <CardDescription>Your previous data deletion requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Deletion Request</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                      {request.completed_at && (
                        <> | Completed: {new Date(request.completed_at).toLocaleDateString()}</>
                      )}
                    </p>
                    {request.notes && request.status === 'rejected' && (
                      <p className="text-xs text-destructive mt-1">
                        Reason: {request.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Data Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Please confirm that you want to permanently delete all your personal data
                  from our platform.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="understand"
                      checked={confirmations.understand}
                      onCheckedChange={(checked) =>
                        setConfirmations(prev => ({ ...prev, understand: !!checked }))
                      }
                    />
                    <Label htmlFor="understand" className="text-sm leading-snug cursor-pointer">
                      I understand that my account will be permanently deleted and I will lose
                      access to all my data, purchase history, and saved items.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="irreversible"
                      checked={confirmations.irreversible}
                      onCheckedChange={(checked) =>
                        setConfirmations(prev => ({ ...prev, irreversible: !!checked }))
                      }
                    />
                    <Label htmlFor="irreversible" className="text-sm leading-snug cursor-pointer">
                      I understand that this action is <strong>irreversible</strong> and my
                      data cannot be recovered once deleted.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="legalRetention"
                      checked={confirmations.legalRetention}
                      onCheckedChange={(checked) =>
                        setConfirmations(prev => ({ ...prev, legalRetention: !!checked }))
                      }
                    />
                    <Label htmlFor="legalRetention" className="text-sm leading-snug cursor-pointer">
                      I understand that some data may be retained for legal compliance purposes
                      (e.g., tax records, fraud prevention).
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Reason for leaving (optional)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Help us improve by telling us why you're leaving..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-20"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDeletionRequest}
              disabled={!canSubmitRequest() || isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Delete My Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DataDeletionRequest;
