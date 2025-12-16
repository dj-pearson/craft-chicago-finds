/**
 * Data Export Request Component
 * GDPR Article 20 - Right to data portability
 */

import { useState, useEffect } from 'react';
import { Download, FileJson, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DataRequest {
  id: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  export_file_path: string | null;
  export_file_expires: string | null;
}

export function DataExportRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<DataRequest[]>([]);

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
        .select('id, request_type, status, created_at, completed_at, export_file_path, export_file_expires')
        .eq('user_id', user.id)
        .eq('request_type', 'export')
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

  const submitExportRequest = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to request your data export.',
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
          description: 'You already have a pending data export request. Please wait for it to complete.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('data_subject_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          request_type: 'export',
          status: 'pending',
          regulation: 'GDPR',
          request_details: {
            format: 'json',
            requested_at: new Date().toISOString(),
            ip_address: 'client-side', // Would be set by server
            user_agent: navigator.userAgent,
          },
        });

      if (error) throw error;

      toast({
        title: 'Export Request Submitted',
        description: 'Your data export request has been submitted. We will process it within 30 days as required by GDPR.',
      });

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

  const downloadExport = async (request: DataRequest) => {
    if (!request.export_file_path) return;

    try {
      // In production, this would download from Supabase Storage
      const { data, error } = await supabase.storage
        .from('exports')
        .download(request.export_file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-export-${user?.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: 'Your data export is being downloaded.',
      });
    } catch (error) {
      console.error('Error downloading export:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download your export. Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 animate-spin" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExportAvailable = (request: DataRequest) => {
    if (request.status !== 'completed' || !request.export_file_path) return false;
    if (request.export_file_expires) {
      return new Date(request.export_file_expires) > new Date();
    }
    return true;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to request a copy of your data.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" aria-hidden="true" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Request a copy of all your personal data in a machine-readable format (JSON).
            Under GDPR Article 20, you have the right to data portability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">What's included in your export:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Account information (name, email, profile)</li>
              <li>Order history and transactions</li>
              <li>Messages and communications</li>
              <li>Saved favorites and preferences</li>
              <li>Reviews you've written</li>
              <li>Seller information (if applicable)</li>
              <li>Listing data (if applicable)</li>
            </ul>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Export requests are typically processed within 7 days. GDPR requires us to respond within 30 days.
              You will receive an email when your export is ready.
            </AlertDescription>
          </Alert>

          <Button
            onClick={submitExportRequest}
            disabled={isSubmitting || requests.some(r => r.status === 'pending' || r.status === 'in_progress')}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileJson className="h-4 w-4" />
                Request Data Export
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>Your previous data export requests</CardDescription>
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
                      <span className="font-medium text-sm">Data Export</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleDateString()}
                      {request.completed_at && (
                        <> | Completed: {new Date(request.completed_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  {isExportAvailable(request) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadExport(request)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}

                  {request.status === 'completed' && request.export_file_expires && new Date(request.export_file_expires) < new Date() && (
                    <span className="text-xs text-muted-foreground">Link expired</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DataExportRequest;
