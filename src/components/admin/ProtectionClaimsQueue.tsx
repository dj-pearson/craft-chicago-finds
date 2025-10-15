import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle, XCircle, Eye, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ProtectionClaim {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  claim_type: string;
  description: string;
  evidence_urls: string[] | null;
  status: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  resolution_amount: number | null;
  created_at: string;
}

export const ProtectionClaimsQueue = () => {
  const [claims, setClaims] = useState<ProtectionClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resolutionData, setResolutionData] = useState<Record<string, {
    type: string;
    notes: string;
    amount: string;
  }>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('protection_claims')
        .select('*')
        .in('status', ['open', 'under_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims(data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error",
        description: "Failed to load protection claims.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (claimId: string) => {
    const resolution = resolutionData[claimId];
    if (!resolution?.type || !resolution?.notes) {
      toast({
        title: "Missing information",
        description: "Please select a resolution type and add notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingId(claimId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        status: 'resolved',
        resolution_type: resolution.type,
        resolution_notes: resolution.notes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      };

      if (resolution.amount) {
        updateData.resolution_amount = parseFloat(resolution.amount);
      }

      const { error } = await supabase
        .from('protection_claims')
        .update(updateData)
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: "Claim resolved",
        description: "The protection claim has been resolved.",
      });

      setClaims(prev => prev.filter(c => c.id !== claimId));
      setResolutionData(prev => {
        const newData = { ...prev };
        delete newData[claimId];
        return newData;
      });
    } catch (error) {
      console.error('Error resolving claim:', error);
      toast({
        title: "Error",
        description: "Failed to resolve claim.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    const resolution = resolutionData[claimId];
    if (!resolution?.notes) {
      toast({
        title: "Missing notes",
        description: "Please add rejection notes.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingId(claimId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('protection_claims')
        .update({
          status: 'rejected',
          resolution_notes: resolution.notes,
          resolved_by: user.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: "Claim rejected",
        description: "The protection claim has been rejected.",
      });

      setClaims(prev => prev.filter(c => c.id !== claimId));
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast({
        title: "Error",
        description: "Failed to reject claim.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getClaimTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      not_as_described: 'Not as Described',
      damaged: 'Damaged',
      not_received: 'Not Received',
      wrong_item: 'Wrong Item',
      defective: 'Defective',
      quality_issue: 'Quality Issue'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Protection Claims Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading claims...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Protection Claims Queue
          <Badge variant="secondary" className="ml-2">
            {claims.length} Open
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No open protection claims</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card key={claim.id} className="border-2 border-destructive/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Claim Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge variant="destructive" className="mb-2">
                          {getClaimTypeLabel(claim.claim_type)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Order:</span> #{claim.order_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Filed: {format(new Date(claim.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50">
                        {claim.status === 'open' ? 'Awaiting Review' : 'Under Review'}
                      </Badge>
                    </div>

                    {/* Claim Description */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Buyer's Complaint:</p>
                      <p className="text-sm whitespace-pre-wrap">{claim.description}</p>
                    </div>

                    {/* Evidence Photos */}
                    {claim.evidence_urls && claim.evidence_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Evidence ({claim.evidence_urls.length}):</p>
                        <div className="flex gap-2 flex-wrap">
                          {claim.evidence_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative"
                            >
                              <img
                                src={url}
                                alt={`Evidence ${idx + 1}`}
                                className="h-24 w-24 object-cover rounded border group-hover:ring-2 ring-primary"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <Eye className="h-6 w-6 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution Form */}
                    <div className="space-y-3 border-t pt-4">
                      <p className="text-sm font-medium">Resolution:</p>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Resolution Type</label>
                        <Select
                          value={resolutionData[claim.id]?.type || ''}
                          onValueChange={(value) => setResolutionData(prev => ({
                            ...prev,
                            [claim.id]: { ...prev[claim.id], type: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select resolution..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="refund_full">Full Refund</SelectItem>
                            <SelectItem value="refund_partial">Partial Refund</SelectItem>
                            <SelectItem value="replacement">Replacement</SelectItem>
                            <SelectItem value="deny">Deny Claim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {resolutionData[claim.id]?.type?.includes('refund') && (
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Refund Amount
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={resolutionData[claim.id]?.amount || ''}
                            onChange={(e) => setResolutionData(prev => ({
                              ...prev,
                              [claim.id]: { ...prev[claim.id], amount: e.target.value }
                            }))}
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                        <Textarea
                          placeholder="Explain your decision and any actions taken..."
                          value={resolutionData[claim.id]?.notes || ''}
                          onChange={(e) => setResolutionData(prev => ({
                            ...prev,
                            [claim.id]: { ...prev[claim.id], notes: e.target.value }
                          }))}
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleResolve(claim.id)}
                        disabled={processingId === claim.id}
                        className="flex-1"
                        variant="default"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolve Claim
                      </Button>
                      <Button
                        onClick={() => handleReject(claim.id)}
                        disabled={processingId === claim.id}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Claim
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
