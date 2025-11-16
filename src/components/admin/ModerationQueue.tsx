/* @ts-nocheck */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QueueItem {
  id: string;
  content_type: string;
  content_id: string;
  status: string;
  priority: string;
  auto_flagged: boolean;
  flag_reasons: any;
  confidence_score: number;
  created_at: string;
  seller_id: string;
}

export const ModerationQueue = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("moderation_queue")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setQueue(data || []);
    } catch (error) {
      console.error("Error loading queue:", error);
      toast({
        title: "Error",
        description: "Failed to load moderation queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (itemId: string, action: 'approved' | 'rejected' | 'flagged') => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("moderation_queue")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes,
        })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Review Complete",
        description: `Item ${action} successfully.`,
      });

      setSelectedItem(null);
      setReviewNotes("");
      loadQueue();
    } catch (error) {
      console.error("Review error:", error);
      toast({
        title: "Error",
        description: "Failed to complete review",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading moderation queue...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Moderation Queue</span>
            <Badge variant="outline">{queue.filter(i => i.status === 'pending').length} Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
              <p className="text-muted-foreground">No items in moderation queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(item.status)}
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <Badge variant="outline">{item.content_type}</Badge>
                      {item.auto_flagged && (
                        <Badge variant="outline" className="bg-amber-50">
                          Auto-flagged ({Math.round(item.confidence_score)}%)
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(item.created_at).toLocaleString()}
                    </p>
                    {item.flag_reasons && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Flagged for:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {Array.isArray(item.flag_reasons) 
                            ? item.flag_reasons.map((reason: string, i: number) => (
                                <li key={i}>{reason}</li>
                              ))
                            : <li>{item.flag_reasons}</li>
                          }
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedItem(item)}
                        disabled={item.status !== 'pending'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Review Content</DialogTitle>
                        <DialogDescription>
                          Review this {item.content_type} and take appropriate action
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Content Details</h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Type:</strong> {item.content_type}</p>
                            <p><strong>Priority:</strong> {item.priority}</p>
                            <p><strong>Auto-flagged:</strong> {item.auto_flagged ? 'Yes' : 'No'}</p>
                            {item.confidence_score && (
                              <p><strong>Confidence:</strong> {Math.round(item.confidence_score)}%</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Review Notes
                          </label>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes about your review decision..."
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={() => handleReview(item.id, 'approved')}
                            disabled={processing}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReview(item.id, 'flagged')}
                            disabled={processing}
                            className="flex-1"
                            variant="outline"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Flag
                          </Button>
                          <Button
                            onClick={() => handleReview(item.id, 'rejected')}
                            disabled={processing}
                            className="flex-1"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
