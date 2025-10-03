import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VerificationRequest {
  id: string;
  seller_id: string;
  verification_type: string;
  verification_status: string;
  verification_data: any;
  submitted_at: string;
  revenue_annual: number;
  revenue_30_day: number;
  verification_deadline: string;
  seller_name: string;
  seller_email: string;
}

export function ComplianceVerification() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadVerificationRequests();
  }, []);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("seller_verifications")
        .select(`
          *,
          profiles!seller_id (
            display_name,
            email
          )
        `)
        .eq("verification_status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      const formattedRequests = data?.map((req: any) => ({
        id: req.id,
        seller_id: req.seller_id,
        verification_type: req.verification_type,
        verification_status: req.verification_status,
        verification_data: req.verification_data,
        submitted_at: req.submitted_at,
        revenue_annual: req.revenue_annual || 0,
        revenue_30_day: req.revenue_30_day || 0,
        verification_deadline: req.verification_deadline,
        seller_name: req.profiles?.display_name || "Unknown",
        seller_email: req.profiles?.email || "",
      })) || [];

      setRequests(formattedRequests);
    } catch (error: any) {
      console.error("Error loading verification requests:", error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: VerificationRequest) => {
    try {
      setProcessing(true);

      const { error } = await supabase
        .from("seller_verifications")
        .update({
          verification_status: "approved",
          verified_at: new Date().toISOString(),
          admin_notes: reviewNotes,
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Verification Approved",
        description: `${request.seller_name}'s identity verification has been approved.`,
      });

      setSelectedRequest(null);
      setReviewNotes("");
      await loadVerificationRequests();
    } catch (error: any) {
      console.error("Error approving verification:", error);
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    if (!reviewNotes.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this verification.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase
        .from("seller_verifications")
        .update({
          verification_status: "rejected",
          admin_notes: reviewNotes,
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Verification Rejected",
        description: `${request.seller_name}'s verification has been rejected.`,
      });

      setSelectedRequest(null);
      setReviewNotes("");
      await loadVerificationRequests();
    } catch (error: any) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (deadline: string) => {
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntil <= 2) {
      return <Badge className="bg-orange-600">Urgent</Badge>;
    } else {
      return <Badge variant="secondary">{daysUntil} days left</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading verification requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Identity Verification Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <Alert>
              <AlertDescription>
                No pending verification requests at this time.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const isPastDeadline = new Date(request.verification_deadline) < new Date();
                
                return (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 ${
                      isPastDeadline ? "border-destructive" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{request.seller_name}</h3>
                          {getStatusBadge(request.verification_deadline)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.seller_email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Annual Revenue</p>
                        <p className="font-medium">${request.revenue_annual.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">30-Day Revenue</p>
                        <p className="font-medium">${request.revenue_30_day.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p className="font-medium">
                          {new Date(request.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p className={`font-medium ${isPastDeadline ? "text-destructive" : ""}`}>
                          {new Date(request.verification_deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {isPastDeadline && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This verification is past its deadline. The seller's account may be
                          suspended.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Identity Verification</DialogTitle>
            <DialogDescription>
              Review the submitted identity information and approve or reject the verification.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Seller Name</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.seller_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.seller_email}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Submitted Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Full Name</p>
                    <p className="text-muted-foreground">
                      {selectedRequest.verification_data?.full_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Date of Birth</p>
                    <p className="text-muted-foreground">
                      {selectedRequest.verification_data?.date_of_birth || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">SSN (Last 4)</p>
                    <p className="text-muted-foreground">
                      ****-{selectedRequest.verification_data?.ssn_last_4 || "****"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">
                      {selectedRequest.verification_data?.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">ID Document Type</p>
                    <p className="text-muted-foreground capitalize">
                      {selectedRequest.verification_data?.id_document_type?.replace("_", " ") || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">ID Document Number</p>
                    <p className="text-muted-foreground">
                      {selectedRequest.verification_data?.id_document_number || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Review Notes (Optional for Approval, Required for Rejection)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this verification review..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={processing}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {processing ? "Processing..." : "Approve Verification"}
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {processing ? "Processing..." : "Reject Verification"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
