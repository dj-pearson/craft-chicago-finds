/* @ts-nocheck */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Zap,
  TrendingUp,
  Users,
  Filter,
  Layers,
  Brain
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  seller_history?: {
    total_violations: number;
    total_approved: number;
    seller_verified: boolean;
    compliance_score: number;
  };
  similar_items?: QueueItem[];
}

interface ModerationRule {
  id: string;
  rule_type: 'auto_approve' | 'auto_reject' | 'escalate';
  confidence_threshold: number;
  flag_reasons?: string[];
  seller_criteria?: {
    verified_only?: boolean;
    min_compliance_score?: number;
  };
  is_active: boolean;
}

interface BatchAction {
  action: 'approved' | 'rejected' | 'flagged';
  item_ids: string[];
  notes: string;
  apply_pattern?: boolean;
}

export const SmartModerationQueue = () => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [sortBy, setSortBy] = useState<'smart' | 'priority' | 'confidence' | 'newest'>('smart');
  const [filterMode, setFilterMode] = useState<'all' | 'auto' | 'manual' | 'similar'>('all');
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [stats, setStats] = useState({
    total_pending: 0,
    auto_approved_today: 0,
    auto_rejected_today: 0,
    manual_review_pending: 0,
    avg_confidence: 0,
    false_positive_rate: 0
  });

  useEffect(() => {
    loadQueue();
    loadRules();
    loadStats();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("moderation_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Enhance items with seller history
      const enhancedData = await Promise.all(
        (data || []).map(async (item) => {
          // Get seller history
          const { data: historyData } = await supabase
            .from("moderation_queue")
            .select("status")
            .eq("seller_id", item.seller_id)
            .neq("id", item.id);

          const totalViolations = historyData?.filter(h => h.status === 'rejected').length || 0;
          const totalApproved = historyData?.filter(h => h.status === 'approved').length || 0;

          // Get seller verification status
          const { data: sellerData } = await supabase
            .from("profiles")
            .select("seller_verified")
            .eq("user_id", item.seller_id)
            .single();

          const seller_history = {
            total_violations: totalViolations,
            total_approved: totalApproved,
            seller_verified: sellerData?.seller_verified || false,
            compliance_score: totalApproved + totalViolations > 0
              ? (totalApproved / (totalApproved + totalViolations)) * 100
              : 100
          };

          // Find similar items (same flag reasons, same content type)
          const similarItems = (data || []).filter(
            d => d.id !== item.id &&
            d.content_type === item.content_type &&
            JSON.stringify(d.flag_reasons) === JSON.stringify(item.flag_reasons)
          );

          return {
            ...item,
            seller_history,
            similar_items: similarItems
          };
        })
      );

      // Apply auto-moderation rules
      await applyAutoModeration(enhancedData);

      setQueue(enhancedData);
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

  const loadRules = async () => {
    try {
      // TODO: Load moderation rules from database
      // For now, use default rules
      const defaultRules: ModerationRule[] = [
        {
          id: '1',
          rule_type: 'auto_approve',
          confidence_threshold: 20,
          is_active: true
        },
        {
          id: '2',
          rule_type: 'auto_reject',
          confidence_threshold: 95,
          is_active: true
        },
        {
          id: '3',
          rule_type: 'auto_approve',
          confidence_threshold: 40,
          seller_criteria: {
            verified_only: true,
            min_compliance_score: 95
          },
          is_active: true
        }
      ];
      setRules(defaultRules);
    } catch (error) {
      console.error("Error loading rules:", error);
    }
  };

  const loadStats = async () => {
    try {
      // TODO: Load real stats from database
      // Mock stats for now
      setStats({
        total_pending: queue.length,
        auto_approved_today: 23,
        auto_rejected_today: 8,
        manual_review_pending: 12,
        avg_confidence: 76.5,
        false_positive_rate: 8.2
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const applyAutoModeration = async (items: QueueItem[]) => {
    const autoActions: Promise<void>[] = [];

    for (const item of items) {
      for (const rule of rules.filter(r => r.is_active)) {
        let shouldApply = false;

        // Check confidence threshold
        if (rule.rule_type === 'auto_approve' && item.confidence_score < rule.confidence_threshold) {
          shouldApply = true;
        } else if (rule.rule_type === 'auto_reject' && item.confidence_score >= rule.confidence_threshold) {
          shouldApply = true;
        }

        // Check seller criteria
        if (shouldApply && rule.seller_criteria) {
          if (rule.seller_criteria.verified_only && !item.seller_history?.seller_verified) {
            shouldApply = false;
          }
          if (rule.seller_criteria.min_compliance_score &&
              item.seller_history!.compliance_score < rule.seller_criteria.min_compliance_score) {
            shouldApply = false;
          }
        }

        // Execute auto-moderation
        if (shouldApply) {
          const action = rule.rule_type === 'auto_approve' ? 'approved' : 'rejected';
          autoActions.push(
            (async () => {
              await supabase
                .from("moderation_queue")
                .update({
                  status: action,
                  reviewed_at: new Date().toISOString(),
                  reviewer_notes: `Auto-${action} by rule: ${rule.rule_type} (confidence: ${item.confidence_score}%)`,
                  auto_moderated: true
                })
                .eq("id", item.id);
            })()
          );
          break; // Only apply first matching rule
        }
      }
    }

    await Promise.all(autoActions);
  };

  const sortQueue = (items: QueueItem[]) => {
    let sorted = [...items];

    switch (sortBy) {
      case 'smart':
        // Smart sorting: revenue impact + urgency + pattern grouping
        sorted.sort((a, b) => {
          // Group similar items together
          const aSimilarCount = a.similar_items?.length || 0;
          const bSimilarCount = b.similar_items?.length || 0;
          if (aSimilarCount !== bSimilarCount) return bSimilarCount - aSimilarCount;

          // Prioritize by urgency (priority)
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
          if (aPriority !== bPriority) return aPriority - bPriority;

          // Then by age
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        break;

      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        sorted.sort((a, b) => {
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
          return aPriority - bPriority;
        });
        break;

      case 'confidence':
        sorted.sort((a, b) => b.confidence_score - a.confidence_score);
        break;

      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return sorted;
  };

  const filterQueue = (items: QueueItem[]) => {
    switch (filterMode) {
      case 'auto':
        return items.filter(i => i.auto_flagged);
      case 'manual':
        return items.filter(i => !i.auto_flagged);
      case 'similar':
        return items.filter(i => (i.similar_items?.length || 0) > 0);
      default:
        return items;
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

  const handleBatchAction = async (action: 'approved' | 'rejected' | 'flagged', applyToSimilar: boolean = false) => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to perform batch action",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      let itemsToProcess = Array.from(selectedItems);

      // If applying to similar items, expand the selection
      if (applyToSimilar) {
        const expandedSet = new Set(itemsToProcess);
        for (const itemId of itemsToProcess) {
          const item = queue.find(i => i.id === itemId);
          if (item && item.similar_items) {
            item.similar_items.forEach(similar => expandedSet.add(similar.id));
          }
        }
        itemsToProcess = Array.from(expandedSet);
      }

      const { error } = await supabase
        .from("moderation_queue")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes || `Batch ${action}`,
        })
        .in("id", itemsToProcess);

      if (error) throw error;

      toast({
        title: "Batch Action Complete",
        description: `${itemsToProcess.length} items ${action} successfully.`,
      });

      setSelectedItems(new Set());
      setReviewNotes("");
      loadQueue();
    } catch (error) {
      console.error("Batch action error:", error);
      toast({
        title: "Error",
        description: "Failed to complete batch action",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectSimilarItems = (item: QueueItem) => {
    const newSelection = new Set(selectedItems);
    newSelection.add(item.id);
    item.similar_items?.forEach(similar => newSelection.add(similar.id));
    setSelectedItems(newSelection);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 95) return 'text-red-600';
    if (score >= 70) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const filteredAndSorted = sortQueue(filterQueue(queue));

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
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Approved Today</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.auto_approved_today}</div>
            <p className="text-xs text-muted-foreground">Automated decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Rejected Today</CardTitle>
            <Zap className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.auto_rejected_today}</div>
            <p className="text-xs text-muted-foreground">Automated decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manual_review_pending}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(100 - stats.false_positive_rate).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{stats.false_positive_rate}% false positives</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Moderation Queue
                <Badge variant="outline">{filteredAndSorted.length} Pending</Badge>
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {selectedItems.size > 0 && (
                <>
                  <Badge variant="secondary">{selectedItems.size} selected</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchAction('approved', false)}
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBatchAction('rejected', false)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Selected
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-2 mt-4">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smart">Smart Sort (Recommended)</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="confidence">By Confidence</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMode} onValueChange={(value: any) => setFilterMode(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="auto">Auto-Flagged Only</SelectItem>
                <SelectItem value="manual">Manual Reports Only</SelectItem>
                <SelectItem value="similar">Has Similar Items</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadQueue}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSorted.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
              <p className="text-muted-foreground">All caught up! No items in moderation queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSorted.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${selectedItems.has(item.id) ? 'bg-muted/50 border-primary' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />

                    {/* Item Content */}
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge variant="outline">{item.content_type}</Badge>
                          {item.auto_flagged && (
                            <Badge variant="outline" className={`${getConfidenceColor(item.confidence_score)}`}>
                              AI: {Math.round(item.confidence_score)}%
                            </Badge>
                          )}
                          {item.similar_items && item.similar_items.length > 0 && (
                            <Badge variant="secondary" className="cursor-pointer" onClick={() => selectSimilarItems(item)}>
                              <Layers className="h-3 w-3 mr-1" />
                              {item.similar_items.length} similar
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>

                      {/* Seller Info */}
                      {item.seller_history && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Seller History: {item.seller_history.total_approved} approved, {item.seller_history.total_violations} violations
                          </span>
                          <span>Compliance: {item.seller_history.compliance_score.toFixed(0)}%</span>
                          {item.seller_history.seller_verified && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      )}

                      {/* Flag Reasons */}
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

                      {/* Created */}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Content</DialogTitle>
              <DialogDescription>
                Review this {selectedItem.content_type} and take appropriate action
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">Seller History</TabsTrigger>
                <TabsTrigger value="similar">Similar Items ({selectedItem.similar_items?.length || 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Content Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Type:</strong> {selectedItem.content_type}</p>
                    <p><strong>Priority:</strong> {selectedItem.priority}</p>
                    <p><strong>Auto-flagged:</strong> {selectedItem.auto_flagged ? 'Yes' : 'No'}</p>
                    {selectedItem.confidence_score && (
                      <p><strong>Confidence:</strong> {Math.round(selectedItem.confidence_score)}%</p>
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
                    onClick={() => handleReview(selectedItem.id, 'approved')}
                    disabled={processing}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedItem.id, 'flagged')}
                    disabled={processing}
                    className="flex-1"
                    variant="outline"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Flag
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedItem.id, 'rejected')}
                    disabled={processing}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="history">
                {selectedItem.seller_history ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Total Approved</p>
                        <p className="text-2xl font-bold text-green-600">{selectedItem.seller_history.total_approved}</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Total Violations</p>
                        <p className="text-2xl font-bold text-red-600">{selectedItem.seller_history.total_violations}</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Compliance Score</p>
                        <p className="text-2xl font-bold">{selectedItem.seller_history.compliance_score.toFixed(0)}%</p>
                      </div>
                      <div className="p-3 border rounded">
                        <p className="text-sm text-muted-foreground">Verification</p>
                        <p className="text-2xl font-bold">
                          {selectedItem.seller_history.seller_verified ? '✓' : '✗'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No seller history available</p>
                )}
              </TabsContent>

              <TabsContent value="similar">
                {selectedItem.similar_items && selectedItem.similar_items.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Found {selectedItem.similar_items.length} similar items with the same flag reasons
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectSimilarItems(selectedItem)}
                      >
                        Select All Similar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {selectedItem.similar_items.map(similar => (
                        <div key={similar.id} className="p-2 border rounded text-sm">
                          <p><strong>{similar.content_type}</strong> - {similar.priority} priority</p>
                          <p className="text-muted-foreground">
                            Confidence: {Math.round(similar.confidence_score)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No similar items found</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
